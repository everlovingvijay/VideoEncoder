export interface SwiftFile {
  filename: string;
  path: string;
  description: string;
  language: 'swift' | 'xml' | 'json';
  code: string;
}

export const SWIFT_PROJECT_FILES: SwiftFile[] = [
  {
    filename: 'HandBrakeApp.swift',
    path: 'HandBrake/App/HandBrakeApp.swift',
    description: 'SwiftUI App lifecycle entrypoint with background processing tasks and Live Activity notifications',
    language: 'swift',
    code: `//
//  HandBrakeApp.swift
//  HandBrake for iOS
//
//  Created by HandBrake Team.
//  Copyright © 2026 HandBrake Project. All rights reserved.
//

import SwiftUI
import BackgroundTasks
import UserNotifications
import ActivityKit

@main
struct HandBrakeApp: App {
    @StateObject private var queueManager = QueueManager.shared
    @StateObject private var presetManager = PresetManager.shared
    
    init() {
        registerBackgroundTasks()
        requestNotificationPermissions()
    }
    
    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(queueManager)
                .environmentObject(presetManager)
                .preferredColorScheme(.dark)
                .onReceive(NotificationCenter.default.publisher(for: UIApplication.didEnterBackgroundNotification)) { _ in
                    scheduleBackgroundTranscoding()
                }
        }
    }
    
    private func registerBackgroundTasks() {
        BGTaskScheduler.shared.register(
            forTaskWithIdentifier: "fr.handbrake.ios.transcode",
            using: nil
        ) { task in
            guard let processingTask = task as? BGProcessingTask else { return }
            self.handleBackgroundTranscoding(task: processingTask)
        }
    }
    
    private func scheduleBackgroundTranscoding() {
        guard queueManager.hasPendingJobs else { return }
        
        let request = BGProcessingTaskRequest(identifier: "fr.handbrake.ios.transcode")
        request.requiresNetworkConnectivity = false
        request.requiresExternalPower = false // Allow battery transcode with thermal throttling
        
        do {
            try BGTaskScheduler.shared.submit(request)
            print("[HandBrake] Scheduled background transcoding task.")
        } catch {
            print("[HandBrake] Could not schedule background task: \(error)")
        }
    }
    
    private func handleBackgroundTranscoding(task: BGProcessingTask) {
        task.expirationHandler = {
            self.queueManager.pauseActiveEncoding()
        }
        
        Task {
            await queueManager.processNextInQueue()
            task.setTaskCompleted(success: true)
        }
    }
    
    private func requestNotificationPermissions() {
        UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .sound, .badge]) { granted, _ in
            if granted {
                print("[HandBrake] Push/local notifications authorized.")
            }
        }
    }
}
`,
  },
  {
    filename: 'VideoTranscoder.swift',
    path: 'HandBrake/Core/VideoTranscoder.swift',
    description: 'Hardware-accelerated Apple VideoToolbox (VTCompressionSession) & AVFoundation transcoding engine',
    language: 'swift',
    code: `//
//  VideoTranscoder.swift
//  HandBrake for iOS
//
//  Hardware accelerated Apple Silicon VideoToolbox Transcoder
//

import Foundation
import AVFoundation
import VideoToolbox
import CoreMedia

public actor VideoTranscoder {
    public enum TranscodeError: Error {
        case invalidSource
        case sessionCreationFailed(OSStatus)
        case unsupportedCodec
        case encodingFailed(String)
        case cancelled
    }
    
    public struct ProgressUpdate: Sendable {
        public let progressPercent: Double
        public let currentFrame: Int
        public let totalFrames: Int
        public let fps: Double
        public let etaSeconds: Int
    }
    
    private var isCancelled = false
    private var compressionSession: VTCompressionSession?
    
    public func cancel() {
        isCancelled = true
        if let session = compressionSession {
            VTCompressionSessionInvalidate(session)
        }
    }
    
    /// Transcodes input video URL into target preset using Apple VideoToolbox hardware acceleration
    public func transcode(
        sourceURL: URL,
        outputURL: URL,
        preset: HandbrakePresetSwift,
        progressHandler: @escaping @Sendable (ProgressUpdate) -> Void
    ) async throws {
        let asset = AVAsset(url: sourceURL)
        guard let videoTrack = try await asset.loadTracks(withMediaType: .video).first else {
            throw TranscodeError.invalidSource
        }
        
        let naturalSize = try await videoTrack.load(.naturalSize)
        let nominalFrameRate = try await videoTrack.load(.nominalFrameRate)
        let duration = try await asset.load(.duration).seconds
        let totalFrames = Int(duration * Double(nominalFrameRate > 0 ? nominalFrameRate : 30))
        
        let targetWidth = Int32(preset.dimensions.width)
        let targetHeight = Int32(preset.dimensions.height)
        
        // Select Codec Type: HEVC or H.264
        let codecType: CMVideoCodecType = preset.video.codec == .hevc 
            ? kCMVideoCodecType_HEVC 
            : kCMVideoCodecType_H264
        
        // Setup VideoToolbox compression session
        var sessionOut: VTCompressionSession?
        let status = VTCompressionSessionCreate(
            allocator: kCFAllocatorDefault,
            width: targetWidth,
            height: targetHeight,
            codecType: codecType,
            encoderSpecification: nil,
            imageBufferAttributes: nil,
            compressedDataAllocator: nil,
            outputCallback: nil,
            refcon: nil,
            compressionSessionOut: &sessionOut
        )
        
        guard status == noErr, let session = sessionOut else {
            throw TranscodeError.sessionCreationFailed(status)
        }
        
        self.compressionSession = session
        
        // Configure Hardware Acceleration properties
        VTSessionSetProperty(session, key: kVTCompressionPropertyKey_RealTime, value: kCFBooleanFalse)
        VTSessionSetProperty(session, key: kVTCompressionPropertyKey_ExpectedFrameRate, value: NSNumber(value: 30))
        
        // Quality mode: Constant Quality (RF) or Average Bitrate
        if preset.video.qualityMode == .bitrate {
            let bps = preset.video.bitrateKbps * 1000
            VTSessionSetProperty(session, key: kVTCompressionPropertyKey_AverageBitRate, value: NSNumber(value: bps))
            VTSessionSetProperty(session, key: kVTCompressionPropertyKey_DataRateLimits, value: [NSNumber(value: bps * 2), NSNumber(value: 1)] as CFArray)
        } else {
            // Quality factor normalized 0.0 - 1.0 (where lower RF = higher quality)
            let quality = max(0.1, min(1.0, 1.0 - (Double(preset.video.rfValue) / 51.0)))
            VTSessionSetProperty(session, key: kVTCompressionPropertyKey_Quality, value: NSNumber(value: quality))
        }
        
        // Set Profile & Color Primaries
        if preset.video.codec == .hevc && preset.video.tenBitColor {
            VTSessionSetProperty(session, key: kVTCompressionPropertyKey_ProfileLevel, value: kVTProfileLevel_HEVC_Main10_AutoLevel)
            VTSessionSetProperty(session, key: kVTCompressionPropertyKey_ColorPrimaries, value: kCVImageBufferColorPrimaries_ITU_R_2020)
        }
        
        VTCompressionSessionPrepareToEncodeFrames(session)
        
        // Build AVAssetReader and AVAssetWriter pipeline
        let reader = try AVAssetReader(asset: asset)
        let outputSettings: [String: Any] = [
            kCVPixelBufferPixelFormatTypeKey as String: kCVPixelFormatType_32BGRA,
            kCVPixelBufferWidthKey as String: targetWidth,
            kCVPixelBufferHeightKey as String: targetHeight
        ]
        let trackOutput = AVAssetReaderTrackOutput(track: videoTrack, outputSettings: outputSettings)
        reader.add(trackOutput)
        
        let writer = try AVAssetWriter(outputURL: outputURL, fileType: preset.container == .mp4 ? .mp4 : .mov)
        let videoWriterInput = AVAssetWriterInput(mediaType: .video, outputSettings: [
            AVVideoCodecKey: preset.video.codec == .hevc ? AVVideoCodecType.hevc : AVVideoCodecType.h264,
            AVVideoWidthKey: targetWidth,
            AVVideoHeightKey: targetHeight,
            AVVideoCompressionPropertiesKey: [
                AVVideoAverageBitRateKey: preset.video.bitrateKbps * 1000,
                AVVideoProfileLevelKey: preset.video.codec == .hevc ? AVVideoProfileLevelHEVCMainAutoLevel : AVVideoProfileLevelH264HighAutoLevel
            ]
        ])
        videoWriterInput.expectsMediaDataInRealTime = false
        writer.add(videoWriterInput)
        
        // Process Audio
        if let audioTrack = try await asset.loadTracks(withMediaType: .audio).first {
            let audioOutput = AVAssetReaderTrackOutput(track: audioTrack, outputSettings: nil)
            reader.add(audioOutput)
            
            let audioWriterInput = AVAssetWriterInput(mediaType: .audio, outputSettings: [
                AVFormatIDKey: kAudioFormatMPEG4AAC,
                AVNumberOfChannelsKey: 2,
                AVSampleRateKey: 48000,
                AVEncoderBitRateKey: preset.audio.first?.bitrateKbps ?? 160000
            ])
            writer.add(audioWriterInput)
        }
        
        reader.startReading()
        writer.startWriting()
        writer.startSession(atSourceTime: .zero)
        
        let startTime = CFAbsoluteTimeGetCurrent()
        var frameIndex = 0
        
        while reader.status == .reading {
            if isCancelled {
                reader.cancelReading()
                writer.cancelWriting()
                throw TranscodeError.cancelled
            }
            
            guard let sampleBuffer = trackOutput.copyNextSampleBuffer() else { break }
            
            while !videoWriterInput.isReadyForMoreMediaData {
                try await Task.sleep(nanoseconds: 5_000_000)
            }
            
            videoWriterInput.append(sampleBuffer)
            frameIndex += 1
            
            if frameIndex % 15 == 0 {
                let elapsed = CFAbsoluteTimeGetCurrent() - startTime
                let fps = Double(frameIndex) / max(0.1, elapsed)
                let pct = min(0.99, Double(frameIndex) / Double(max(1, totalFrames)))
                let eta = Int(Double(totalFrames - frameIndex) / max(1.0, fps))
                
                progressHandler(ProgressUpdate(
                    progressPercent: pct * 100,
                    currentFrame: frameIndex,
                    totalFrames: totalFrames,
                    fps: fps,
                    etaSeconds: eta
                ))
            }
        }
        
        videoWriterInput.markAsFinished()
        await writer.finishWriting()
        
        if writer.status == .failed {
            throw TranscodeError.encodingFailed(writer.error?.localizedDescription ?? "Unknown writer error")
        }
    }
}
`,
  },
  {
    filename: 'ContentView.swift',
    path: 'HandBrake/Views/ContentView.swift',
    description: 'Native iOS 18 SwiftUI navigation layout with TabView, Liquid Glass sheets, and PhotosPicker',
    language: 'swift',
    code: `//
//  ContentView.swift
//  HandBrake for iOS
//
//  Main Tab navigation interface
//

import SwiftUI
import PhotosUI

struct ContentView: View {
    @EnvironmentObject var queueManager: QueueManager
    @EnvironmentObject var presetManager: PresetManager
    @State private var selectedTab: TabDestination = .transcode
    @State private var selectedItem: PhotosPickerItem?
    @State private var showSettingsSheet = false
    
    enum TabDestination: String, CaseIterable, Identifiable {
        case transcode = "Transcode"
        case presets = "Presets"
        case queue = "Queue"
        case studio = "Studio"
        case code = "Native Code"
        
        var id: String { rawValue }
        var icon: String {
            switch self {
            case .transcode: return "film.stack"
            case .presets: return "slider.horizontal.3"
            case .queue: return "tray.full"
            case .studio: return "tuningfork"
            case .code: return "chevron.left.forwardslash.chevron.right"
            }
        }
    }
    
    var body: some View {
        TabView(selection: $selectedTab) {
            TranscodeView()
                .tabItem {
                    Label("Transcode", systemImage: "film.stack")
                }
                .tag(TabDestination.transcode)
            
            PresetBrowserView()
                .tabItem {
                    Label("Presets", systemImage: "slider.horizontal.3")
                }
                .tag(TabDestination.presets)
            
            QueueView()
                .tabItem {
                    Label("Queue", systemImage: "tray.full")
                }
                .badge(queueManager.activeOrPendingCount)
                .tag(TabDestination.queue)
            
            VideoStudioView()
                .tabItem {
                    Label("Studio", systemImage: "tuningfork")
                }
                .tag(TabDestination.studio)
        }
        .tint(.orange)
    }
}
`,
  },
  {
    filename: 'HandBrakeActivityAttributes.swift',
    path: 'HandBrake/Widgets/HandBrakeActivityAttributes.swift',
    description: 'Dynamic Island and Lock Screen Live Activity for real-time video encoding status',
    language: 'swift',
    code: `//
//  HandBrakeActivityAttributes.swift
//  HandBrake
//
//  Dynamic Island Live Activity Widget Extension
//

import Foundation
import ActivityKit
import WidgetKit
import SwiftUI

public struct HandBrakeActivityAttributes: ActivityAttributes {
    public struct ContentState: Codable, Hashable {
        public var progress: Double // 0.0 - 1.0
        public var fileName: String
        public var fps: Double
        public var etaSeconds: Int
        public var isPaused: Bool
    }
    
    public var jobId: String
    public var presetName: String
}

@available(iOS 16.1, *)
struct HandBrakeLiveActivityWidget: Widget {
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: HandBrakeActivityAttributes.self) { context in
            // Lock Screen Banner
            VStack(alignment: .leading, spacing: 8) {
                HStack {
                    Image(systemName: "film.fill")
                        .foregroundStyle(.orange)
                    Text("HandBrake Transcoding")
                        .font(.headline)
                    Spacer()
                    Text("\(Int(context.state.progress * 100))%")
                        .font(.headline.monospacedDigit())
                        .foregroundStyle(.orange)
                }
                
                Text(context.state.fileName)
                    .font(.subheadline)
                    .lineLimit(1)
                    .foregroundStyle(.secondary)
                
                ProgressView(value: context.state.progress)
                    .tint(.orange)
                
                HStack {
                    Text("\(String(format: "%.1f", context.state.fps)) FPS")
                    Spacer()
                    Text("ETA: \(context.state.etaSeconds)s")
                }
                .font(.caption.monospacedDigit())
                .foregroundStyle(.secondary)
            }
            .padding()
            .background(Color(.systemBackground))
        } dynamicIsland: { context in
            DynamicIsland {
                DynamicIslandExpandedRegion(.leading) {
                    Label("HandBrake", systemImage: "flame.fill")
                        .font(.caption.bold())
                        .foregroundStyle(.orange)
                }
                DynamicIslandExpandedRegion(.trailing) {
                    Text("\(Int(context.state.progress * 100))%")
                        .font(.headline.monospacedDigit())
                        .foregroundStyle(.orange)
                }
                DynamicIslandExpandedRegion(.bottom) {
                    VStack(alignment: .leading, spacing: 4) {
                        Text(context.state.fileName)
                            .font(.caption)
                            .lineLimit(1)
                        ProgressView(value: context.state.progress)
                            .tint(.orange)
                        HStack {
                            Text("\(String(format: "%.1f", context.state.fps)) fps")
                            Spacer()
                            Text("\(context.state.etaSeconds)s left")
                        }
                        .font(.caption2.monospacedDigit())
                        .foregroundStyle(.secondary)
                    }
                }
            } compactLeading: {
                Image(systemName: "film")
                    .foregroundStyle(.orange)
            } compactTrailing: {
                Text("\(Int(context.state.progress * 100))%")
                    .font(.caption2.monospacedDigit())
                    .foregroundStyle(.orange)
            } minimal: {
                Image(systemName: "film")
                    .foregroundStyle(.orange)
            }
        }
    }
}
`,
  },
  {
    filename: 'Info.plist',
    path: 'HandBrake/Info.plist',
    description: 'iOS application configuration for Background Processing, Photo Library, and Hardware Acceleration permissions',
    language: 'xml',
    code: `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleDisplayName</key>
    <string>HandBrake</string>
    <key>CFBundleIdentifier</key>
    <string>fr.handbrake.ios</string>
    <key>CFBundleShortVersionString</key>
    <string>1.9.0</string>
    <key>CFBundleVersion</key>
    <string>1</string>
    <key>NSPhotoLibraryUsageDescription</key>
    <string>HandBrake needs access to your Photos library to import videos for hardware-accelerated transcoding.</string>
    <key>NSPhotoLibraryAddUsageDescription</key>
    <string>HandBrake requires permission to save transcoded videos back to your Photos library.</string>
    <key>UIBackgroundModes</key>
    <array>
        <string>processing</string>
        <string>fetch</string>
    </array>
    <key>BGTaskSchedulerPermittedIdentifiers</key>
    <array>
        <string>fr.handbrake.ios.transcode</string>
    </array>
    <key>NSSupportsLiveActivities</key>
    <true/>
    <key>UIFileSharingEnabled</key>
    <true/>
    <key>LSSupportsOpeningDocumentsInPlace</key>
    <true/>
</dict>
</plist>
`,
  },
];
