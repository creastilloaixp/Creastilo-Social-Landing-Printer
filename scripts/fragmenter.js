import { exec } from 'child_process';
import ffmpeg from 'ffmpeg-static';
import path from 'path';
import fs from 'fs';

/**
 * NANO BANANA FRAGMENTER
 * Logic: Extract precisely 60 cinematic frames from the AI video
 * to feed the Scroll-Sequencer engine.
 */
async function fragmentVideo() {
    const videoPath = path.resolve('public/agency_cinematic.mp4');
    const outputDir = path.resolve('public/frames');
    
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    console.log("[FRAGMENTER] Initiating process...");
    console.log(`[VIDEO_SOURCE] ${videoPath}`);

    // We want 60 frames total. 
    // Video is 8 seconds long. 
    // Frame rate target = 60 / 8 = 7.5 fps
    const command = `"${ffmpeg}" -i "${videoPath}" -vf "fps=7.5,scale=1920:-1" -vframes 60 "${path.join(outputDir, 'creastilo_%d.jpg')}"`;

    exec(command, (error, stdout, stderr) => {
        if (error) {
            console.error(`[ERROR] Fragmentation failed: ${error.message}`);
            return;
        }
        console.log("[SUCCESS] Video fragmented into 60 high-end frames.");
        console.log(`[TARGET] Check ${outputDir} for creastilo_1.jpg through creastilo_60.jpg`);
    });
}

fragmentVideo();
