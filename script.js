document.addEventListener('DOMContentLoaded', function () {
    gsap.registerPlugin(ScrollTrigger);

    // --- Page Elements ---
    const landingPage = document.getElementById('landing-page');
    const monitoringPage = document.getElementById('monitoring-page');
    const reportPage = document.getElementById('report-page');
    const demoBtn = document.getElementById('demo-btn');
    const backToLandingBtn = document.getElementById('back-to-landing-btn');
    const backToMonitoringBtn = document.getElementById('back-to-monitoring-btn');
    const applicantListContainer = document.getElementById('applicant-list');
    const reportContentWrapper = document.getElementById('report-content-wrapper');

    // --- Navigation ---
    function showPage(page) {
        landingPage.classList.add('hidden');
        monitoringPage.classList.add('hidden');
        reportPage.classList.add('hidden');
        page.classList.remove('hidden');
        window.scrollTo(0, 0);
    }

    if (demoBtn) demoBtn.addEventListener('click', () => { populateApplicantList(); showPage(monitoringPage); });
    if (backToLandingBtn) backToLandingBtn.addEventListener('click', () => showPage(landingPage));
    if (backToMonitoringBtn) backToMonitoringBtn.addEventListener('click', () => showPage(monitoringPage));

    // --- Populate Applicant List ---
    function populateApplicantList() {
        if (!applicantListContainer) return;
        applicantListContainer.innerHTML = '';
        Object.keys(applicantsData).forEach(applicantId => {
            const applicant = applicantsData[applicantId];
            const latestRecord = applicant.history.reduce(
                (latest, current) => (current.Month_Offset > latest.Month_Offset) ? current : latest,
                applicant.history[0]
            );

            const riskCategory = latestRecord.Risk_Category;
            const riskPercentage = (latestRecord.Predicted_Prob_Default * 100).toFixed(2);
            const riskColorClass =
                riskCategory === 'Low' ? 'risk-low' :
                riskCategory === 'Medium' ? 'risk-medium' : 'risk-high';

            const item = document.createElement('div');
            item.className = 'glass-card monitoring-card p-4 rounded-lg flex justify-between items-center cursor-pointer transition duration-300';
            item.innerHTML = `
                <div>
                    <p class="text-slate-400 text-sm">Applicant ID</p>
                    <p class="text-white font-semibold text-lg">${parseInt(applicantId)}</p>
                </div>
                <div class="text-right">
                    <p class="text-slate-400 text-sm">Risk (${riskCategory})</p>
                    <p class="font-semibold text-lg ${riskColorClass}">${riskPercentage}%</p>
                </div>
            `;
            item.addEventListener('click', () => { createDossierReport(applicantId); showPage(reportPage); });
            applicantListContainer.appendChild(item);
        });
    }

    // --- Create RISKON Themed "Dossier" Report ---
    function createDossierReport(applicantId) {
        const applicant = applicantsData[applicantId];
        const latestRecord = applicant.history.reduce(
            (latest, current) => (current.Month_Offset > latest.Month_Offset) ? current : latest,
            applicant.history[0]
        );

        const prob = latestRecord.Predicted_Prob_Default;
        let cibilScore;
        if (prob <= 0.15) { cibilScore = 780 + (1 - prob / 0.15) * 120; }
        else if (prob <= 0.70) { cibilScore = 650 + (1 - (prob - 0.15) / 0.55) * 130; }
        else { cibilScore = 300 + (1 - (prob - 0.70) / 0.30) * 350; }
        cibilScore = Math.round(cibilScore);

        const riskCategory = latestRecord.Risk_Category;
        const riskColorClass =
            riskCategory === 'Low' ? 'risk-low' :
            riskCategory === 'Medium' ? 'risk-medium' : 'risk-high';

        const paymentHistoryHTML = applicant.history
            .sort((a, b) => b.Month_Offset - a.Month_Offset)
            .map(h => {
                const probPercent = (h.Predicted_Prob_Default * 100).toFixed(1);
                const historyRiskColor =
                    h.Risk_Category === 'Low' ? 'risk-low' :
                    h.Risk_Category === 'Medium' ? 'risk-medium' : 'risk-high';
                return `<div class="info-pair"><span class="label">Month ${h.Month_Offset}:</span><span class="value ${historyRiskColor}">${probPercent}% (${h.Risk_Category})</span></div>`;
            })
            .join('');

        const reportHTML = `
            <div id="report-page-container" class="report-container" style="opacity: 0;">
                <div class="report-header">
                    <h1>RISKON&trade; Intelligence Report</h1>
                    <div class="report-info">
                        <strong>Applicant ID:</strong> ${applicantId}<br>
                        <strong>Report Date:</strong> ${new Date().toLocaleDateString('en-GB')}
                    </div>
                </div>
                <div class="section grid-2-col">
                    <div class="report-section">
                        <h3 class="report-section-title">Personal Details</h3>
                        <div class="report-section-content">
                            <div class="info-pair"><span class="label">Name:</span> <span class="value">${applicant.personal.name}</span></div>
                            <div class="info-pair"><span class="label">Date of Birth:</span> <span class="value">${applicant.personal.dob}</span></div>
                            <div class="info-pair"><span class="label">Gender:</span> <span class="value">${applicant.personal.gender}</span></div>
                        </div>
                    </div>
                    <div class="report-section">
                        <h3 class="report-section-title">RISKON Score</h3>
                        <div class="score-box">
                            <div id="cibil-score-span" class="score-value ${riskColorClass}">300</div>
                            <div class="score-label">CIBIL Equivalent</div>
                        </div>
                    </div>
                </div>
                <div class="section report-section">
                    <h3 class="report-section-title">RISK ANALYSIS & TRACKING</h3>
                    <div class="report-section-content">
                        <div class="graph-container">
                            <img src="${applicant.graphImage}" alt="Risk Trend Graph for Applicant ${applicantId}">
                        </div>
                    </div>
                </div>
                <div class="section report-section">
                    <h3 class="report-section-title">RECENT RISK HISTORY</h3>
                    <div class="report-section-content payment-history-grid">
                        ${paymentHistoryHTML}
                    </div>
                </div>
                <div class="report-generation-section">
                    <button id="generate-report-btn" onclick="handleGenerateReport('${applicantId}')" class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-full transition duration-300 flex items-center mx-auto">
                        <svg class="w-6 h-6 mr-2" viewBox="0 0 24 24"><path fill="currentColor" d="M12,1.75A10.25,10.25,0,0,0,1.75,12A10.25,10.25,0,0,0,12,22.25A10.25,10.25,0,0,0,22.25,12A10.25,10.25,0,0,0,12,1.75ZM9.25,6a1.5,1.5,0,1,1-1.5,1.5A1.5,1.5,0,0,1,9.25,6Zm6,12a1.5,1.5,0,1,1,1.5-1.5A1.5,1.5,0,0,1,15.25,18Zm-2-6a1.5,1.5,0,1,1-1.5,1.5A1.5,1.5,0,0,1,13.25,12Z"/></svg>
                        Generate Quick Summary
                    </button>
                    <div id="ai-summary-container" class="hidden mt-6">
                        <div class="report-section">
                            <h3 class="report-section-title">QUICK SUMMARY</h3>
                            <div class="report-section-content">
                                <p id="ai-summary-text" class="text-base leading-relaxed text-gray-300"></p>
                            </div>
                        </div>
                        <button id="download-pdf-btn" class="mt-4 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-full transition duration-300">
                            Download as PDF
                        </button>
                    </div>
                </div>
            </div>
        `;

        reportContentWrapper.innerHTML = reportHTML;

        // Bind download button AFTER report is in DOM
        const downloadBtn = document.getElementById('download-pdf-btn');
        if (downloadBtn) downloadBtn.addEventListener('click', () => downloadReportAsPDF(applicantId));

        // Animate report appearance
        const tl = gsap.timeline();
        const scoreCounter = { value: 300 };

        tl.to("#report-page-container", { opacity: 1, duration: 0.5 })
          .to(scoreCounter, {
              value: cibilScore,
              duration: 1.5,
              ease: "power2.out",
              onUpdate: () => {
                  const el = document.getElementById("cibil-score-span");
                  if (el) el.textContent = Math.round(scoreCounter.value);
              }
          }, "-=0.2")
          .from(".section", { opacity: 0, y: 30, stagger: 0.2, duration: 0.6 }, "-=1.2")
          .from(".graph-container img", { scale: 1.1, opacity: 0, duration: 1, ease: "power2.out" }, "-=0.8");
    }

    // --- Utility: wait for images in an element to load ---
    function waitForImages(el) {
        const imgs = Array.from(el.querySelectorAll('img')).filter(img => !img.complete || img.naturalWidth === 0);
        if (imgs.length === 0) return Promise.resolve();
        return Promise.all(imgs.map(img => new Promise(res => {
            img.addEventListener('load', res, { once: true });
            img.addEventListener('error', res, { once: true }); // still resolve to not block forever
        })));
    }

   // --- FIXED PDF Function ---
async function downloadReportAsPDF(applicantId) {
    const applicant = applicantsData[applicantId];
    const reportElement = document.getElementById('report-page-container');
    if (!reportElement) {
        console.error("Report element not found.");
        return;
    }

    // --- 1. Wait for images ---
    const imgs = reportElement.querySelectorAll("img");
    await Promise.all(Array.from(imgs).map(img => {
        if (img.complete) return Promise.resolve();
        return new Promise(res => {
            img.onload = res;
            img.onerror = res;
        });
    }));

    // --- 2. Give GSAP animations time to finish ---
    await new Promise(res => setTimeout(res, 500));

    // --- 3. Clone the node for a static snapshot ---
    const clone = reportElement.cloneNode(true);

    // remove blinking cursor in clone
    const aiText = clone.querySelector("#ai-summary-text");
    if (aiText) {
        aiText.textContent = aiText.textContent; // strip pseudo ::after
    }

    const options = {
        margin: 0.5,
        filename: `RISKON_Report_${applicantId}_${applicant.personal.name.replace(/\s+/g, '_')}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
            scale: 2,
            useCORS: true,
            backgroundColor: '#1f2937' // dark bg fix
        },
        jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
    };

    html2pdf().set(options).from(clone).save();
}


    // --- Handle Report Generation Click ---
    window.handleGenerateReport = function (applicantId) {
        const applicant = applicantsData[applicantId];
        const summaryContainer = document.getElementById('ai-summary-container');
        const summaryContent = document.getElementById('ai-summary-text');
        const generateBtn = document.getElementById('generate-report-btn');

        if (!summaryContainer || !summaryContent || !generateBtn) return;

        summaryContent.textContent = "";
        summaryContainer.classList.remove('hidden');
        gsap.set(summaryContainer, { height: 'auto', opacity: 1 });
        gsap.from(summaryContainer, { height: 0, opacity: 0, duration: 0.6, ease: 'power2.out' });

        generateBtn.style.display = 'none';

        setTimeout(() => {
            const summary = applicant.geminiSummary;
            let i = 0;
            (function typeWriter() {
                if (i < summary.length) {
                    summaryContent.innerHTML += summary.charAt(i);
                    i++;
                    setTimeout(typeWriter, 15);
                }
            })();
        }, 800);
    };

    // --- Hero Animation ---
    let heroScene, heroCamera, heroRenderer, heroParticles;
    function initHeroAnimation() {
        const container = document.getElementById('hero-animation');
        if (!container) return;

        heroScene = new THREE.Scene();
        heroCamera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        heroRenderer = new THREE.WebGLRenderer({ alpha: true });
        heroRenderer.setSize(window.innerWidth, window.innerHeight);
        container.appendChild(heroRenderer.domElement);

        const particleCount = 8000;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const heroTargetPositions = new Float32Array(particleCount * 3);
        const heroInitialPositions = new Float32Array(particleCount * 3);

        const fontLoader = new THREE.FontLoader();
        fontLoader.load(
            'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/fonts/helvetiker_bold.typeface.json',
            function (font) {
                const textGeometry = new THREE.TextGeometry('RISKON', { font: font, size: 1.5, height: 0.2, curveSegments: 12 });
                textGeometry.center();

                const sampler = new THREE.MeshSurfaceSampler(new THREE.Mesh(textGeometry)).build();
                const tempPosition = new THREE.Vector3();
                for (let i = 0; i < particleCount; i++) {
                    sampler.sample(tempPosition);
                    heroTargetPositions[i * 3] = tempPosition.x;
                    heroTargetPositions[i * 3 + 1] = tempPosition.y;
                    heroTargetPositions[i * 3 + 2] = tempPosition.z;
                }

                for (let i = 0; i < particleCount; i++) {
                    const i3 = i * 3;
                    const radius = 10;
                    const theta = 2 * Math.PI * Math.random();
                    const phi = Math.acos(2 * Math.random() - 1);
                    positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
                    positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
                    positions[i3 + 2] = radius * Math.cos(phi);
                }

                heroInitialPositions.set(positions);
                geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
                const material = new THREE.PointsMaterial({ color: 0x3b82f6, size: 0.035, transparent: true, opacity: 0 });
                heroParticles = new THREE.Points(geometry, material);
                heroScene.add(heroParticles);
                gsap.to(heroParticles.material, { opacity: 1, duration: 1 });
            }
        );

        heroCamera.position.z = 10;

        const heroTimeline = gsap.timeline({
            scrollTrigger: { trigger: "#hero-section", start: "top top", end: "bottom bottom", scrub: 1 }
        });

        heroTimeline.to({}, {
            duration: 1,
            onUpdate: function () {
                const progress = this.progress();
                if (heroParticles) {
                    const pos = heroParticles.geometry.attributes.position.array;
                    for (let i = 0; i < particleCount; i++) {
                        const i3 = i * 3;
                        pos[i3] = THREE.MathUtils.lerp(heroInitialPositions[i3], heroTargetPositions[i3], progress);
                        pos[i3 + 1] = THREE.MathUtils.lerp(heroInitialPositions[i3 + 1], heroTargetPositions[i3 + 1], progress);
                        pos[i3 + 2] = THREE.MathUtils.lerp(heroInitialPositions[i3 + 2], heroTargetPositions[i3 + 2], progress);
                    }
                    heroParticles.geometry.attributes.position.needsUpdate = true;
                }
            }
        }, 0);

        heroTimeline.to({}, {
            duration: 1,
            onUpdate: function () {
                const progress = this.progress();
                if (heroParticles) {
                    const pos = heroParticles.geometry.attributes.position.array;
                    for (let i = 0; i < particleCount; i++) {
                        const i3 = i * 3;
                        const dx = heroTargetPositions[i3] * (1 + progress * 5);
                        const dy = heroTargetPositions[i3 + 1] * (1 + progress * 5);
                        const dz = heroTargetPositions[i3 + 2] * (1 + progress * 5);
                        pos[i3] = dx; pos[i3 + 1] = dy; pos[i3 + 2] = dz;
                    }
                    heroParticles.geometry.attributes.position.needsUpdate = true;
                    heroParticles.material.opacity = 1 - progress;
                }
            }
        }, 1);

        heroTimeline.to("#hero-text", { opacity: 1, duration: 0.5 }, 1.5);

        animateHero();
    }

    function animateHero() {
        requestAnimationFrame(animateHero);
        if (heroRenderer) {
            if (heroParticles && !ScrollTrigger.isScrolling) heroParticles.rotation.y += 0.0001;
            heroRenderer.render(heroScene, heroCamera);
        }
    }

    window.addEventListener('resize', () => {
        if (heroRenderer) {
            heroCamera.aspect = window.innerWidth / window.innerHeight;
            heroCamera.updateProjectionMatrix();
            heroRenderer.setSize(window.innerWidth, window.innerHeight);
        }
    }, false);

    initHeroAnimation();

    // --- "JOURNEY OF DATA" ANIMATION ---
    const solutionStepsData = [
        { title: "Stage 1 - Ingestion", description: "We take in the chaos." },
        { title: "Stage 2 - Processing", description: "We process and structure information." },
        { title: "Stage 3 - Intelligence", description: "We learn from the patterns." },
        { title: "Stage 4 - Prediction", description: "We predict risk, before it strikes." }
    ];

    const stepsContainer = document.getElementById('solution-steps');
    if (stepsContainer) {
        stepsContainer.innerHTML = '';
        solutionStepsData.forEach((step, i) => {
            stepsContainer.innerHTML += `
                <div class="step-content" id="step-${i}">
                    <h3 class="text-3xl font-bold mb-3">${step.title}</h3>
                    <p class="text-slate-400 text-lg">${step.description}</p>
                </div>
            `;
        });
    }

    let vizScene, vizCamera, vizRenderer, particles, lines, dashboard;
    function initSolutionViz() {
        const container = document.getElementById('solution-viz');
        if (!container) return;

        vizScene = new THREE.Scene();
        vizCamera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
        vizRenderer = new THREE.WebGLRenderer({ alpha: true });
        vizRenderer.setSize(container.clientWidth, container.clientHeight);
        container.appendChild(vizRenderer.domElement);
        vizCamera.position.set(0, 0, 15);

        const particleGeo = new THREE.BufferGeometry();
        const particleCount = 2000;
        const posArray = new Float32Array(particleCount * 3);
        for (let i = 0; i < particleCount * 3; i++) posArray[i] = (Math.random() - 0.5) * 20;
        particleGeo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
        const particleMat = new THREE.PointsMaterial({ size: 0.05, color: 0x94a3b8 });
        particles = new THREE.Points(particleGeo, particleMat);
        vizScene.add(particles);

        const lineGeo = new THREE.BufferGeometry();
        const linePos = new Float32Array(200 * 3);
        lineGeo.setAttribute('position', new THREE.BufferAttribute(linePos, 3));
        const lineMat = new THREE.LineBasicMaterial({ color: 0x3b82f6, transparent: true, opacity: 0 });
        lines = new THREE.Line(lineGeo, lineMat);
        vizScene.add(lines);

        const dashGeo = new THREE.PlaneGeometry(8, 5);
        const dashMat = new THREE.MeshBasicMaterial({ color: 0x1f2937, transparent: true, opacity: 0, side: THREE.DoubleSide });
        dashboard = new THREE.Mesh(dashGeo, dashMat);
        vizScene.add(dashboard);

        const tl = gsap.timeline({
            scrollTrigger: {
                trigger: "#solution-section-container",
                start: "top top",
                end: "bottom bottom",
                scrub: 1,
                onUpdate: (self) => {
                    const progress = self.progress;
                    const stepProgress = Math.floor(progress * solutionStepsData.length);
                    const stepContents = document.querySelectorAll(".step-content");
                    stepContents.forEach((step, i) => {
                        step.classList.toggle('is-active', i === stepProgress);
                    });
                }
            }
        });

        tl.to(particles.position, { x: 0, y: 0, z: -5, duration: 0.25 });
        tl.to(particles.scale, { x: 0.2, y: 0.2, z: 0.2, duration: 0.25 }, "<");
        tl.to(lines.material, { opacity: 1, duration: 0.05 });
        tl.to(particles.scale, { x: 0, y: 0, z: 0, duration: 0.05 }, "<");
        tl.to(lines.material, { opacity: 0, duration: 0.05 });

        tl.call(() => {
            const positions = particles.geometry.attributes.position.array;
            for (let i = 0; i < particleCount; i++) {
                const cluster = Math.floor(Math.random() * 3);
                positions[i * 3]     = (cluster - 1) * 4 + (Math.random() - 0.5) * 2;
                positions[i * 3 + 1] = (Math.random() - 0.5) * 2;
                positions[i * 3 + 2] = (Math.random() - 0.5) * 2;
            }
            particles.geometry.attributes.position.needsUpdate = true;
        });

        tl.to(particles.scale, { x: 1, y: 1, z: 1, duration: 0.2 });
        tl.to(particles.scale, { x: 0, y: 0, z: 0, duration: 0.2 });
        tl.to(dashboard.scale, { x: 1, y: 1, z: 1, duration: 0.2 }, "<");
        tl.to(dashboard.material, { opacity: 0.8, duration: 0.2 }, "<");

        animateViz();
    }

    function animateViz() {
        requestAnimationFrame(animateViz);
        if (vizRenderer) {
            if (lines && lines.material.opacity > 0) {
                const linePos = lines.geometry.attributes.position.array;
                const t = Date.now() * 0.001;
                for (let i = 0; i < 200; i++) {
                    const i3 = i * 3;
                    const progress = i / 199;
                    linePos[i3]     = Math.cos(t + progress * 10) * (3 - progress * 3);
                    linePos[i3 + 1] = Math.sin(t + progress * 10) * (3 - progress * 3);
                    linePos[i3 + 2] = (progress - 0.5) * 10;
                }
                lines.geometry.attributes.position.needsUpdate = true;
            }
            vizRenderer.render(vizScene, vizCamera);
        }
    }

    initSolutionViz();
});
