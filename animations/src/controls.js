function initControls(timeline, startTimes, initialStepIndex, labelElement) {
    let mainTl = timeline;
    let stepStartTimes = startTimes;
    let currentStepIndex = initialStepIndex;
    let labelEl = labelElement;

    const prevBtn = document.getElementById('prevBtn');
    const playPauseBtn = document.getElementById('playPauseBtn');
    const nextBtn = document.getElementById('nextBtn');

    function getStepIndexFromTime(time) {
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

    function goToStep(index) {
        const currentPlayTime = mainTl.currentTime;
        let targetTime;

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
                    playPauseBtn.textContent = 'Play';
                }
            }
        });
    }

    playPauseBtn.addEventListener('click', () => {
        if (mainTl.paused) {
            mainTl.play();
            playPauseBtn.textContent = 'Pause';
        } else {
            mainTl.pause();
            playPauseBtn.textContent = 'Play';
        }
    });

    prevBtn.addEventListener('click', () => {
        const currentIdx = getStepIndexFromTime(mainTl.currentTime);
        if (mainTl.currentTime === stepStartTimes[currentIdx]) {
            goToStep(currentIdx - 1);
        } else {
            goToStep(currentIdx);
        }
    });

    nextBtn.addEventListener('click', () => {
        const currentIdx = getStepIndexFromTime(mainTl.currentTime);
        goToStep(currentIdx + 1);
    });

    // Initial state
    mainTl.pause(); // Start paused
    playPauseBtn.textContent = 'Play';
    goToStep(0); // Go to the first step
}

window.initControls = initControls;