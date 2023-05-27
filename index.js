// CarterUI Version 0.1
// By 2Devs

// on document ready
document.addEventListener("DOMContentLoaded", function (event) {
    const typewriterContainer = document.getElementById("typewriter-container");
    const animationDuration = 1000; // Duration of the typing animation in milliseconds
    const recordButton = document.getElementById("recordButton");
    const urlParams = new URLSearchParams(window.location.search);
    const apiKey = urlParams.get("key"); // Get API Key from URL
    const stalls = [
        "one second",
        "hmm, let's see",
        "uh, one moment",
        "got it",
        "ok",
        "just a moment",
        "gotchya",
        "ah",
    ];
    let recording = false;
    let myvad = null;

    function showTime(){
        var date = new Date();
        var h = date.getHours(); // 0 - 23
        var m = date.getMinutes(); // 0 - 59
        var s = date.getSeconds(); // 0 - 59
        var session = "AM";
        
        if(h == 0){
            h = 12;
        }
        
        if(h > 12){
            h = h - 12;
            session = "PM";
        }
        
        h = (h < 10) ? "0" + h : h;
        m = (m < 10) ? "0" + m : m;
        //s = (s < 10) ? "0" + s : s;
        
        var time = h + ":" + m + " " + session;
        document.getElementById("time").innerText = time;
        document.getElementById("time").textContent = time;
        
        setTimeout(showTime, 1000);
        
    }
    
    showTime();

    function showDate(){

        let dateArea = document.getElementById("date")
        let date = new Date()
        let day = date.getDay();  
        //console.log(day);
        if (day == 1) { dateArea.innerText = "Monday"}
        if (day == 2) { dateArea.innerText = "Tuesday"}
        if (day == 3) { dateArea.innerText = "Wednesday"}
        if (day == 4) { dateArea.innerText = "Thursday"}
        if (day == 5) { dateArea.innerText = "Friday"}
        if (day == 6) { dateArea.innerText = "Saturday"}
        if (day == 7) { dateArea.innerText = "Sunday"}
    }
    
    showDate();

    function processAudio(audio) {
        const audioDuration = audio.length / 16000;

        if (audioDuration < 0.5) {
            recordButton.innerText = "Speak";
            return false;
        }

        if (audioDuration > 2) {
            speakRandomStall();
        }

        return true;
    }

    function speakRandomStall() {
        speak(stalls[Math.floor(Math.random() * stalls.length)]);
    }

    function postDataToAPI(audio) {
        const wavBuffer = vad.utils.encodeWAV(audio);
        const base64 = vad.utils.arrayBufferToBase64(wavBuffer);

        fetch("https://api.carterlabs.ai/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                audio: base64,
                key: apiKey,
                playerId: "Primary User",
                speak: true
            }),
        })
            .then((response) => response.json())
            .then((data) => {
                var outputText = data.output.text;

                recordButton.innerText = "Speak";

                // restart animation of output
                const maxLength = 50;
                const lines = splitText(outputText, maxLength);
                addLinesSequentially(lines, animationDuration);
                speak(data.output.audio);
                console.log(data.output.audio);
            })
            .catch((error) => {
                console.error(error);
            });
    }

    function sleep(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    async function addLinesSequentially(lines, animationDuration) {
        typewriterContainer.innerHTML = "";
        for (const line of lines) {
            const typewriterLine = createTypewriterLine(line);
            typewriterContainer.appendChild(typewriterLine);
            await sleep(animationDuration);
        }
    }

    function createTypewriterLine(content) {
        const line = document.createElement("div");
        line.classList.add("typewriter-text");
        line.textContent = content;
        return line;
    }

    function splitText(text, maxLength) {
        const words = text.split(" ");
        const lines = [];
        let currentLine = "";

        for (const word of words) {
            if (currentLine.length + word.length <= maxLength) {
                currentLine += word + " ";
            } else {
                lines.push(currentLine.trim());
                currentLine = word + " ";
            }
        }

        if (currentLine.trim()) {
            lines.push(currentLine.trim());
        }

        return lines;
    }

    function speak(url) {
        const audio = new Audio(url);
        audio.play();
    }

    async function main() {
        myvad = await vad.MicVAD.new({
            positiveSpeechThreshold: 0.8,
            negativeSpeechThreshold: 0.8 - 0.15,
            minSpeechFrames: 1,
            preSpeechPadFrames: 1,
            redemptionFrames: 3,
            onSpeechStart: () => {
                recordButton.innerText = "Listening...";
            },
            onSpeechEnd: (audio) => {
                myvad.pause();

                recordButton.innerText = "Processing...";

                if (processAudio(audio)) {
                    postDataToAPI(audio);
                }
            },
        });
    }
    recordButton.addEventListener("click", () => {
        recording = true;
        recordButton.innerText = "Listening...";
        myvad.start();
    });
    main();
});
