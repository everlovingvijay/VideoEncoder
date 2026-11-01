export interface AndroidFile {
  filename: string;
  path: string;
  description: string;
  language: 'kotlin' | 'xml' | 'groovy';
  code: string;
}

export const ANDROID_PROJECT_FILES: AndroidFile[] = [
  {
    filename: 'MainActivity.kt',
    path: 'app/src/main/java/fr/handbrake/android/MainActivity.kt',
    description: 'Jetpack Compose entrypoint with Material 3 navigation and Android 14 Photo Picker',
    language: 'kotlin',
    code: `package fr.handbrake.android

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
import androidx.activity.result.PickVisualMediaRequest
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.navigation.compose.*
import fr.handbrake.android.ui.theme.HandBrakeTheme
import fr.handbrake.android.transcoder.MediaCodecTranscoder

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            HandBrakeTheme(darkTheme = true) {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    HandBrakeMainScreen()
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun HandBrakeMainScreen() {
    var selectedTab by remember { mutableStateOf(0) }
    val tabs = listOf("Transcode", "Presets", "Queue", "Studio", "Kotlin Code")

    Scaffold(
        bottomBar = {
            NavigationBar {
                tabs.forEachIndexed { index, title ->
                    NavigationBarItem(
                        selected = selectedTab == index,
                        onClick = { selectedTab = index },
                        label = { Text(title) },
                        icon = { /* Material 3 icon */ }
                    )
                }
            }
        }
    ) { innerPadding ->
        Box(modifier = Modifier.padding(innerPadding)) {
            when (selectedTab) {
                0 -> TranscodeScreen()
                1 -> PresetsScreen()
                2 -> QueueScreen()
                3 -> VideoStudioScreen()
                4 -> KotlinCodeScreen()
            }
        }
    }
}
`,
  },
  {
    filename: 'MediaCodecTranscoder.kt',
    path: 'app/src/main/java/fr/handbrake/android/transcoder/MediaCodecTranscoder.kt',
    description: 'High-performance Android MediaCodec & MediaMuxer hardware accelerated transcoding engine',
    language: 'kotlin',
    code: `package fr.handbrake.android.transcoder

import android.content.Context
import android.media.*
import android.net.Uri
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.File
import java.nio.ByteBuffer

class MediaCodecTranscoder(private val context: Context) {

    data class ProgressUpdate(
        val progressPercent: Int,
        val currentFrame: Long,
        val fps: Double,
        val etaSeconds: Int
    )

    suspend fun transcode(
        inputUri: Uri,
        outputFile: File,
        targetWidth: Int = 1920,
        targetHeight: Int = 1080,
        targetBitrate: Int = 6_000_000,
        useHevc: Boolean = true,
        onProgress: (ProgressUpdate) -> Unit
    ): Boolean = withContext(Dispatchers.Default) {
        val extractor = MediaExtractor().apply {
            setDataSource(context, inputUri, null)
        }

        val videoTrackIndex = selectTrack(extractor, isVideo = true)
        val audioTrackIndex = selectTrack(extractor, isVideo = false)

        if (videoTrackIndex < 0) return@withContext false

        extractor.selectTrack(videoTrackIndex)
        val inputFormat = extractor.getTrackFormat(videoTrackIndex)
        val durationUs = inputFormat.getLong(MediaFormat.KEY_DURATION)

        // Setup MediaMuxer
        val muxer = MediaMuxer(outputFile.absolutePath, MediaMuxer.OutputFormat.MUXER_OUTPUT_MPEG_4)
        val mimeType = if (useHevc) MediaFormat.MIMETYPE_VIDEO_HEVC else MediaFormat.MIMETYPE_VIDEO_AVC

        // Setup Hardware MediaCodec Encoder
        val outputFormat = MediaFormat.createVideoFormat(mimeType, targetWidth, targetHeight).apply {
            setInteger(MediaFormat.KEY_COLOR_FORMAT, MediaCodecInfo.CodecCapabilities.COLOR_FormatSurface)
            setInteger(MediaFormat.KEY_BIT_RATE, targetBitrate)
            setInteger(MediaFormat.KEY_FRAME_RATE, 30)
            setInteger(MediaFormat.KEY_I_FRAME_INTERVAL, 1) // 1 second keyframe
            if (useHevc) {
                setInteger(MediaFormat.KEY_PROFILE, MediaCodecInfo.CodecProfileLevel.HEVCProfileMain)
            }
        }

        val encoder = MediaCodec.createEncoderByType(mimeType)
        encoder.configure(outputFormat, null, null, MediaCodec.CONFIGURE_FLAG_ENCODE)
        val inputSurface = encoder.createInputSurface()
        encoder.start()

        // Setup Hardware Decoder
        val decoderMime = inputFormat.getString(MediaFormat.KEY_MIME) ?: MediaFormat.MIMETYPE_VIDEO_AVC
        val decoder = MediaCodec.createDecoderByType(decoderMime)
        decoder.configure(inputFormat, null, null, 0)
        decoder.start()

        var muxerStarted = false
        var muxerVideoTrack = -1
        val bufferInfo = MediaCodec.BufferInfo()
        val startTime = System.currentTimeMillis()
        var frameCount = 0L

        // Pipeline processing loop
        var sawInputEOS = false
        var sawOutputEOS = false

        while (!sawOutputEOS) {
            if (!sawInputEOS) {
                val inIndex = decoder.dequeueInputBuffer(10_000)
                if (inIndex >= 0) {
                    val buffer = decoder.getInputBuffer(inIndex)!!
                    val sampleSize = extractor.readSampleData(buffer, 0)
                    if (sampleSize < 0) {
                        sawInputEOS = true
                        decoder.queueInputBuffer(inIndex, 0, 0, 0, MediaCodec.BUFFER_FLAG_END_OF_STREAM)
                    } else {
                        decoder.queueInputBuffer(inIndex, 0, sampleSize, extractor.sampleTime, 0)
                        extractor.advance()
                    }
                }
            }

            // Drain encoder
            val outIndex = encoder.dequeueOutputBuffer(bufferInfo, 10_000)
            if (outIndex == MediaCodec.INFO_OUTPUT_FORMAT_CHANGED) {
                if (!muxerStarted) {
                    muxerVideoTrack = muxer.addTrack(encoder.outputFormat)
                    muxer.start()
                    muxerStarted = true
                }
            } else if (outIndex >= 0) {
                val outBuffer = encoder.getOutputBuffer(outIndex)!!
                if (bufferInfo.flags and MediaCodec.BUFFER_FLAG_CODEC_CONFIG == 0 && muxerStarted) {
                    muxer.writeSampleData(muxerVideoTrack, outBuffer, bufferInfo)
                    frameCount++

                    if (frameCount % 30 == 0L) {
                        val elapsed = (System.currentTimeMillis() - startTime) / 1000.0
                        val fps = frameCount / Math.max(0.1, elapsed)
                        val pct = ((bufferInfo.presentationTimeUs.toDouble() / durationUs) * 100).toInt().coerceIn(0, 100)
                        onProgress(ProgressUpdate(pct, frameCount, fps, 10))
                    }
                }
                encoder.releaseOutputBuffer(outIndex, false)
                if (bufferInfo.flags and MediaCodec.BUFFER_FLAG_END_OF_STREAM != 0) {
                    sawOutputEOS = true
                }
            }
        }

        // Cleanup
        decoder.stop()
        decoder.release()
        encoder.stop()
        encoder.release()
        muxer.stop()
        muxer.release()
        extractor.release()

        true
    }

    private fun selectTrack(extractor: MediaExtractor, isVideo: Boolean): Int {
        val target = if (isVideo) "video/" else "audio/"
        for (i in 0 until extractor.trackCount) {
            val mime = extractor.getTrackFormat(i).getString(MediaFormat.KEY_MIME) ?: ""
            if (mime.startsWith(target)) return i
        }
        return -1
    }
}
`,
  },
  {
    filename: 'TranscodeWorker.kt',
    path: 'app/src/main/java/fr/handbrake/android/work/TranscodeWorker.kt',
    description: 'Android WorkManager background execution worker for resilient encodes when screen is off',
    language: 'kotlin',
    code: `package fr.handbrake.android.work

import android.content.Context
import android.net.Uri
import androidx.work.*
import fr.handbrake.android.transcoder.MediaCodecTranscoder
import java.io.File

class TranscodeWorker(
    context: Context,
    workerParams: WorkerParameters
) : CoroutineWorker(context, workerParams) {

    override suspend fun doWork(): Result {
        val inputUriString = inputData.getString("inputUri") ?: return Result.failure()
        val outputFilePath = inputData.getString("outputPath") ?: return Result.failure()
        val targetWidth = inputData.getInt("targetWidth", 1920)
        val targetHeight = inputData.getInt("targetHeight", 1080)
        val bitrate = inputData.getInt("bitrate", 6000000)

        val transcoder = MediaCodecTranscoder(applicationContext)
        val success = transcoder.transcode(
            inputUri = Uri.parse(inputUriString),
            outputFile = File(outputFilePath),
            targetWidth = targetWidth,
            targetHeight = targetHeight,
            targetBitrate = bitrate,
            useHevc = true
        ) { progress ->
            setProgressAsync(workDataOf("progress" to progress.progressPercent))
        }

        return if (success) Result.success() else Result.failure()
    }
}
`,
  },
  {
    filename: 'AndroidManifest.xml',
    path: 'app/src/main/AndroidManifest.xml',
    description: 'Android manifest with foreground service, media access, and hardware acceleration flags',
    language: 'xml',
    code: `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="fr.handbrake.android">

    <uses-permission android:name="android.permission.READ_MEDIA_VIDEO" />
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE_MEDIA_PROCESSING" />
    <uses-permission android:name="android.permission.WAKE_LOCK" />

    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="HandBrake"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/Theme.HandBrake"
        android:hardwareAccelerated="true">
        
        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:configChanges="orientation|screenSize|screenLayout|keyboardHidden">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>

        <service
            android:name=".service.TranscodeForegroundService"
            android:foregroundServiceType="mediaProcessing"
            android:exported="false" />
    </application>
</manifest>
`,
  },
];
