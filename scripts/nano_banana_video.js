import axios from 'axios';
import fs from 'fs';
import path from 'path';
import * as dotenv from 'dotenv';

dotenv.config();

const API_KEY = process.env.VITE_GEMINI_API_KEY;
const MODEL = "veo-3.1-generate-preview"; // Latest video generation model

/**
 * NANO BANANA 2 - VIDEO SYNTHESIS ENGINE
 * Generates high-fidelity AI video assets (up to 5-10s)
 * for the agency's cinematic backgrounds.
 */
async function generateVideo() {
    const config = JSON.parse(fs.readFileSync('.nano_banana', 'utf-8'));
    console.log(`[VEO_ENGINE] Initiating Video Generation: ${config.mission}...`);

    const prompt = `${config.sequence.start_state.prompt} transitioning into ${config.sequence.end_state.prompt}. ${config.style_invariant}`;

    try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:predictLongRunning?key=${API_KEY}`;
        
        const response = await axios.post(url, {
            instances: [{ prompt: prompt }],
            parameters: {
                sampleCount: 1,
                aspectRatio: "16:9",
                resolution: "1080p",
                durationSeconds: 8
            }
        });

        const operationName = response.data.name;
        console.log(`[OPERATION_CREATED] ID: ${operationName}`);
        console.log(`[POLLING] Waiting for synthesis completion (this can take 2-5 minutes)...`);

        // Start Polling
        pollOperation(operationName);

    } catch (error) {
        console.error("[ERROR] Video generation failed start:", error.response?.data || error.message);
    }
}

async function pollOperation(name) {
    const url = `https://generativelanguage.googleapis.com/v1beta/${name}?key=${API_KEY}`;
    
    const interval = setInterval(async () => {
        try {
            const response = await axios.get(url);
            const status = response.data;

            if (status.done) {
                clearInterval(interval);
                console.log("[SUCCESS] Video generation complete!");
                
                // Debug response structure
                console.log("[DEBUG] Full Response Structure:", JSON.stringify(status.response, null, 2));

                const outputs = status.response.outputs || [];
                const samples = status.response.generateVideoResponse?.generatedSamples || [];
                
                let videoData = null;
                let videoUri = null;

                if (outputs.length > 0 && outputs[0].bytesBase64Encoded) {
                    videoData = outputs[0].bytesBase64Encoded;
                } else if (status.response.video?.bytesBase64Encoded) {
                    videoData = status.response.video.bytesBase64Encoded;
                } else if (samples.length > 0 && samples[0].video?.uri) {
                    videoUri = samples[0].video.uri;
                }

                const outputPath = path.resolve(process.cwd(), 'public', 'agency_cinematic.mp4');

                if (videoData) {
                    fs.writeFileSync(outputPath, Buffer.from(videoData, 'base64'));
                    console.log(`[MISSION_COMPLETE] Video saved to ${outputPath}`);
                } else if (videoUri) {
                    console.log(`[DOWNLOADING] Fetching video from URI: ${videoUri}`);
                    const videoResponse = await axios.get(`${videoUri}&key=${API_KEY}`, { responseType: 'arraybuffer' });
                    fs.writeFileSync(outputPath, videoResponse.data);
                    console.log(`[MISSION_COMPLETE] Video downloaded and saved to ${outputPath}`);
                } else {
                    throw new Error("Could not find video data or URI in the API response.");
                }
            } else {
                console.log(`[STATUS] Still processing... (Progress: ${status.metadata?.progress || 'calculating'}%)`);
            }
        } catch (error) {
            console.error("[POLL_ERROR]", error.message);
        }
    }, 15000); // Poll every 15 seconds
}

generateVideo();
