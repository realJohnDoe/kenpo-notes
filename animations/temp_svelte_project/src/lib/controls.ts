let mainTl: any;
let stepStartTimes: number[];
let currentStepIndex: number;
let playPauseBtn: HTMLButtonElement;
let prevBtn: HTMLButtonElement;
let nextBtn: HTMLButtonElement;
let labelEl: HTMLElement;

export function initControls(timeline: any, startTimes: number[], initialStepIndex: number, labelElement: HTMLElement) {
    mainTl = timeline;
    stepStartTimes = startTimes;
    currentStepIndex = initialStepIndex;
    labelEl = labelElement;

    prevBtn = document.getElementById('prevBtn') as HTMLButtonElement;
    playPauseBtn = document.getElementById('playPauseBtn') as HTMLButtonElement;
    nextBtn = document.getElementById('nextBtn') as HTMLButtonElement;

    function getStepIndexFromTime(time: number): number {
        for (let i = 0; i < stepStartTimes.length - 1; i++) {
            if (time >= stepStartTimes[i] && time < stepStartTimes[i+1]) {
                return i;
            }
        }
        if (time >= stepStartTimes[stepStartTimes.length - 1]) {
            return stepStartTimes.length - 2;
        }
        return 0;
    }

    function goToStep(index: number) {
        const currentPlayTime = mainTl.currentTime;
        let targetTime: number;

        if (index >= 0 && index < stepStartTimes.length - 1) {
            targetTime = stepStartTimes[index];
        } else if (index === stepStartTimes.length - 1) {
            targetTime = mainTl.duration;
        } else {
            return; // Invalid index
        }

        const duration = Math.abs(targetTime - currentPlayTime);

        anime({
            targets: mainTl,
            currentTime: targetTime,
            duration: duration * 0.1, // A fast animation, 10% of the actual time difference
            easing: 'linear',
            update: () => {
                mainTl.seek(mainTl.currentTime);
            },
            complete: () => {
                currentStepIndex = index;
                if (!mainTl.paused) {
                    mainTl.pause();
                    if (playPauseBtn) playPauseBtn.textContent = 'Play';
                }
            }
        });
    }

    if (playPauseBtn) {
        playPauseBtn.addEventListener('click', () => {
            if (mainTl.paused) {
                mainTl.resume();
                playPauseBtn.textContent = 'Pause';
            } else {
                mainTl.pause();
                playPauseBtn.textContent = 'Play';
            }
        });
    }

    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            const currentIdx = getStepIndexFromTime(mainTl.currentTime);
            if (mainTl.currentTime === stepStartTimes[currentIdx]) {
                goToStep(currentIdx - 1);
            }
            else {
                goToStep(currentIdx);
            }
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            const currentIdx = getStepIndexFromTime(mainTl.currentTime);
            goToStep(currentIdx + 1);
        });
    }

    // Initial state
    mainTl.pause(); // Start paused
    if (playPauseBtn) playPauseBtn.textContent = 'Play';
    goToStep(0); // Go to the first step
}

// Define SVG constants here, as they are used in this file
export const PLAY_SVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>';
export const PAUSE_SVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M6 6h4v12H6zm8 0h4v12h-4z"/></svg>';
