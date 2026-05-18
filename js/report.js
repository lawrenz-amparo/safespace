// report.js – Dynamic sorting of probabilities (highest first)
(function() {
    'use strict';

    // Store AI result to reuse when form fields change
    let currentAiResult = null;

    // Mobile menu toggle
    const menuBtn = document.getElementById('menuBtn');
    const mobileMenu = document.getElementById('mobileMenu');
    if (menuBtn && mobileMenu) {
        menuBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            mobileMenu.classList.toggle('hidden');
        });
        document.addEventListener('click', function(event) {
            if (!menuBtn.contains(event.target) && !mobileMenu.contains(event.target)) {
                mobileMenu.classList.add('hidden');
            }
        });
    }

    // Helper: Normalize offense label (map "Not Harassment" to "Not Sexual Harassment")
    function normalizeOffenseLabel(label) {
        return label === 'Not Harassment' ? 'Not Sexual Harassment' : label;
    }

    // Helper: Format probability to 4 decimal places
    function formatProb(value) {
        return value.toFixed(4);
    }

    // Helper: Format percentage
    function formatPercent(value) {
        return (value * 100).toFixed(2);
    }

    // Get classification description
    function getClassificationDescription(classificationLabel) {
        switch(classificationLabel) {
            case 'Grave':
                return 'This incident involves serious acts that may cause significant harm and may require immediate intervention and escalation.';
            case 'Less Grave':
                return 'This incident involves moderately serious acts that should be addressed promptly but may not require emergency intervention.';
            case 'Light':
                return 'This incident involves minor acts that can typically be resolved through counseling and preventive measures.';
            default:
                return 'Classification level determined by AI analysis.';
        }
    }

    // Add classification badge to the result panel
    function addClassificationBadge(classificationLabel, classificationConfidence) {
        const badgeContainer = document.getElementById('classificationLevelContainer');
        if (!badgeContainer) return;
        
        badgeContainer.innerHTML = '';
        
        let classificationColor = '';
        let classificationIcon = '';
        
        switch(classificationLabel) {
            case 'Grave':
                classificationColor = 'bg-red-100 text-red-800 border-red-200';
                classificationIcon = 'fa-exclamation-triangle';
                break;
            case 'Less Grave':
                classificationColor = 'bg-orange-100 text-orange-800 border-orange-200';
                classificationIcon = 'fa-chart-line';
                break;
            case 'Light':
                classificationColor = 'bg-yellow-100 text-yellow-800 border-yellow-200';
                classificationIcon = 'fa-thermometer-half';
                break;
            default:
                classificationColor = 'bg-gray-100 text-gray-800 border-gray-200';
                classificationIcon = 'fa-info-circle';
        }
        
        badgeContainer.innerHTML = `
            <div class="flex items-center justify-between">
                <span class="text-xs text-[#6F5E5E] uppercase tracking-wider">
                    <i class="fas ${classificationIcon} mr-1"></i> Classification of Acts Assessment
                </span>
                <span class="px-2 py-1 rounded-full text-xs font-medium ${classificationColor}">
                    ${classificationLabel} (${formatPercent(classificationConfidence)}% confidence)
                </span>
            </div>
            <p class="text-xs text-[#6F5E5E] mt-2">
                ${getClassificationDescription(classificationLabel)}
            </p>
        `;
    }

    // Update UI with classification results – with sorted probabilities
    function updateResultUI(apiResponse, descriptionText) {
        const offenseData = apiResponse.offense;
        const severityData = apiResponse.severity;
        
        const offenseProbs = offenseData.probabilities;
        const offenseLabel = normalizeOffenseLabel(offenseData.label);
        const offenseConfidence = offenseData.confidence;
        
        const severityLabel = severityData.label;
        const severityConfidence = severityData.confidence;
        
        // Update predicted label and confidence
        const harassmentTypeResult = document.getElementById('harassmentTypeResult');
        const confidenceText = document.getElementById('confidenceText');
        
        harassmentTypeResult.innerHTML = `${offenseLabel}`;
        confidenceText.innerHTML = `Confidence: ${formatPercent(offenseConfidence)}% | Classification: ${severityLabel} (${formatPercent(severityConfidence)}%)`;
        
        // Update description
        const shortDesc = descriptionText.length > 280 ? descriptionText.substring(0, 277) + '...' : descriptionText;
        document.getElementById('resultDescription').innerHTML = `“${escapeHtml(shortDesc)}”`;
        
        // --- Sort probabilities descending ---
        const sortedEntries = Object.entries(offenseProbs)
            .map(([key, val]) => {
                let displayKey = key === 'Not Harassment' ? 'Not Sexual Harassment' : key;
                return { label: displayKey, value: val };
            })
            .sort((a, b) => b.value - a.value);
        
        const probContainer = document.querySelector('#resultPanel .bg-\\[\\#F9F4F4\\] .space-y-3.text-xs');
        if (probContainer) {
            probContainer.innerHTML = '';
            sortedEntries.forEach(({ label, value }) => {
                const barClass = label === 'Not Sexual Harassment' ? 'bg-gray-400' : 'bg-up';
                const row = document.createElement('div');
                row.innerHTML = `
                    <div class="flex justify-between mb-1">
                        <span>${label}</span>
                        <span class="prob-value">${formatProb(value)}</span>
                    </div>
                    <div class="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div class="h-full ${barClass} rounded-full prob-bar" style="width: ${value * 100}%"></div>
                    </div>
                `;
                probContainer.appendChild(row);
            });
        } else {
            // Fallback to static IDs if container not found
            document.getElementById('probPhyVal').innerHTML = formatProb(offenseProbs["Physical Harassment"] || 0);
            document.getElementById('probVerbVal').innerHTML = formatProb(offenseProbs["Verbal Harassment"] || 0);
            document.getElementById('probNonvVal').innerHTML = formatProb(offenseProbs["Non-Verbal Harassment"] || 0);
            document.getElementById('probNotVal').innerHTML = formatProb(offenseProbs["Not Sexual Harassment"] || offenseProbs["Not Harassment"] || 0);
            document.getElementById('probCybVal').innerHTML = formatProb(offenseProbs["Cyber Sexual Harassment"] || 0);
            
            document.getElementById('probPhyBar').style.width = ((offenseProbs["Physical Harassment"] || 0) * 100) + '%';
            document.getElementById('probVerbBar').style.width = ((offenseProbs["Verbal Harassment"] || 0) * 100) + '%';
            document.getElementById('probNonvBar').style.width = ((offenseProbs["Non-Verbal Harassment"] || 0) * 100) + '%';
            document.getElementById('probNotBar').style.width = ((offenseProbs["Not Sexual Harassment"] || offenseProbs["Not Harassment"] || 0) * 100) + '%';
            document.getElementById('probCybBar').style.width = ((offenseProbs["Cyber Sexual Harassment"] || 0) * 100) + '%';
        }
        
        addClassificationBadge(severityLabel, severityConfidence);
        
        currentAiResult = {
            category: offenseLabel,
            severity: severityLabel
        };
        
        mapLawsWithAI();
    }

    function mapLawsWithAI() {
        if (window.LawMapper && window.LawMapper.analyzeAndDisplayLaws && currentAiResult) {
            window.LawMapper.analyzeAndDisplayLaws(currentAiResult);
        } else if (!window.LawMapper) {
            console.warn('LawMapper not loaded yet');
        }
    }

    function escapeHtml(str) {
        return str.replace(/[&<>]/g, function(m) {
            if (m === '&') return '&amp;';
            if (m === '<') return '&lt;';
            if (m === '>') return '&gt;';
            return m;
        }).replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, function(c) {
            return c;
        });
    }

    function showError(message) {
        const errorDiv = document.getElementById('errorMessage');
        errorDiv.innerHTML = `<i class="fas fa-exclamation-triangle mr-2"></i> ${escapeHtml(message)}`;
        errorDiv.classList.remove('hidden');
        setTimeout(() => {
            errorDiv.classList.add('hidden');
        }, 5000);
    }

    function setLoading(isLoading) {
        const submitBtn = document.getElementById('submitBtn');
        if (isLoading) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Analyzing...';
        } else {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-scale-balanced"></i> Classify & Map Laws';
        }
    }

    async function callHarassmentAPI(description) {
    //    const API_URL = 'http://178.128.114.206/predict';
        const API_URL = '/api/predict';
        const requestBody = { description: description };
        
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });
        
        if (!response.ok) {
            let errorMsg = `API error: ${response.status}`;
            try {
                const errData = await response.json();
                errorMsg = errData.detail || errData.message || errorMsg;
            } catch(e) {}
            throw new Error(errorMsg);
        }
        
        const result = await response.json();
        
        if (!result.offense || !result.severity) {
            throw new Error('Invalid response structure from server. Expected offense and severity objects.');
        }
        if (!result.offense.probabilities || !result.offense.label || result.offense.confidence === undefined) {
            throw new Error('Invalid offense data structure from server');
        }
        if (!result.severity.probabilities || !result.severity.label || result.severity.confidence === undefined) {
            throw new Error('Invalid severity data structure from server');
        }
        
        return result;
    }

    function validateForm() {
        const victimClass = document.getElementById('victimClass').value;
        const perpClass = document.getElementById('perpClass').value;
        const victimUP = document.querySelector('input[name="victimUP"]:checked');
        const perpUP = document.querySelector('input[name="perpUP"]:checked');
        const relationship = document.getElementById('relationship').value;
        
        if (!victimClass) {
            showError('Please select victim classification');
            return false;
        }
        if (!perpClass) {
            showError('Please select complained classification');
            return false;
        }
        if (!victimUP) {
            showError('Please indicate if victim is a UP Constituent');
            return false;
        }
        if (!perpUP) {
            showError('Please indicate if perpetrator is a UP Constituent');
            return false;
        }
        if (!relationship) {
            showError('Please select relationship with the respondent');
            return false;
        }
        return true;
    }

    async function translateToEnglish(text) {
        if (!text.trim()) return text;
        try {
            const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=tl&tl=en&dt=t&q=${encodeURIComponent(text)}`;
            const response = await fetch(url);
            const data = await response.json();
            if (data && data[0]) {
                let translatedText = '';
                for (let i = 0; i < data[0].length; i++) {
                    if (data[0][i][0]) translatedText += data[0][i][0];
                }
                return translatedText || text;
            }
            return text;
        } catch (error) {
            console.warn('Translation failed:', error);
            return text;
        }
    }

    document.getElementById('reportForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        const description = document.getElementById('incident-description').value.trim();
        const resultPanel = document.getElementById('resultPanel');
        const errorDiv = document.getElementById('errorMessage');
        errorDiv.classList.add('hidden');
        
        if (!description) {
            showError('Please describe the incident before submitting.');
            return;
        }
        if (!validateForm()) return;
        
        setLoading(true);
        try {
            const translatedDescription = await translateToEnglish(description);
            console.log("Translated Text: ", translatedDescription);
            const apiResult = await callHarassmentAPI(translatedDescription);
            updateResultUI(apiResult, description);
            resultPanel.classList.remove('hidden');
            resultPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        } catch (error) {
            console.error('Classification error:', error);
            showError(`Classification failed: ${error.message}. Make sure the backend server is running at http://178.128.114.206/predict`);
            resultPanel.classList.add('hidden');
        } finally {
            setLoading(false);
        }
    });

    document.getElementById('resetBtn').addEventListener('click', function() {
        document.getElementById('incident-description').value = '';
        document.getElementById('resultPanel').classList.add('hidden');
        document.getElementById('errorMessage').classList.add('hidden');
        
        const victimRadio = document.querySelectorAll('input[name="victimUP"]');
        const perpRadio = document.querySelectorAll('input[name="perpUP"]');
        victimRadio.forEach(radio => radio.checked = false);
        perpRadio.forEach(radio => radio.checked = false);
        
        const victimSelect = document.getElementById('victimClass');
        const perpSelect = document.getElementById('perpClass');
        const relationshipSelect = document.getElementById('relationship');
        const locationSelect = document.getElementById('incidentLocation');
        if (victimSelect) victimSelect.value = '';
        if (perpSelect) perpSelect.value = '';
        if (relationshipSelect) relationshipSelect.value = '';
        if (locationSelect) locationSelect.value = '';
        
        const classificationContainer = document.getElementById('classificationLevelContainer');
        if (classificationContainer) classificationContainer.innerHTML = '';
        
        const lawsContainer = document.getElementById('applicableLawsContainer');
        if (lawsContainer) lawsContainer.innerHTML = '<!-- Laws will be populated here -->';
        
        currentAiResult = null;
    });

    document.addEventListener('relationshipOptionsUpdated', function() {
        const resultPanel = document.getElementById('resultPanel');
        if (resultPanel && !resultPanel.classList.contains('hidden') && currentAiResult) mapLawsWithAI();
    });
    
    document.addEventListener('complainedOptionsUpdated', function() {
        const resultPanel = document.getElementById('resultPanel');
        if (resultPanel && !resultPanel.classList.contains('hidden') && currentAiResult) mapLawsWithAI();
    });
    
    const formFields = ['victimClass', 'perpClass', 'relationship', 'incidentLocation'];
    formFields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field) {
            field.addEventListener('change', function() {
                const resultPanel = document.getElementById('resultPanel');
                if (resultPanel && !resultPanel.classList.contains('hidden') && currentAiResult) mapLawsWithAI();
            });
        }
    });
    
    const victimRadios = document.querySelectorAll('input[name="victimUP"]');
    const perpRadios = document.querySelectorAll('input[name="perpUP"]');
    victimRadios.forEach(radio => radio.addEventListener('change', function() {
        const resultPanel = document.getElementById('resultPanel');
        if (resultPanel && !resultPanel.classList.contains('hidden') && currentAiResult) mapLawsWithAI();
    }));
    perpRadios.forEach(radio => radio.addEventListener('change', function() {
        const resultPanel = document.getElementById('resultPanel');
        if (resultPanel && !resultPanel.classList.contains('hidden') && currentAiResult) mapLawsWithAI();
    }));

    console.log('Report.js initialized (sorted probabilities)');
})();