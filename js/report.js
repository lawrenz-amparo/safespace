// report.js
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

    // Helper: Format probability to 4 decimal places
    function formatProb(value) {
        return value.toFixed(4);
    }

    // Helper: Format percentage
    function formatPercent(value) {
        return (value * 100).toFixed(2);
    }

    // Get classification description (renamed from severity)
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

    // Add classification badge to the result panel (renamed from addSeverityBadge)
    function addClassificationBadge(classificationLabel, classificationConfidence) {
        // Use the new container ID from HTML
        const badgeContainer = document.getElementById('classificationLevelContainer');
        if (!badgeContainer) return;
        
        // Clear existing content
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

    // Update UI with classification results
    function updateResultUI(apiResponse, descriptionText) {
        const offenseData = apiResponse.offense;
        const severityData = apiResponse.severity;
        
        const offenseProbs = offenseData.probabilities;
        const offenseLabel = offenseData.label;
        const offenseConfidence = offenseData.confidence;
        
        const severityLabel = severityData.label;
        const severityConfidence = severityData.confidence;
        
        // Update predicted label and confidence
        const harassmentTypeResult = document.getElementById('harassmentTypeResult');
        const confidenceText = document.getElementById('confidenceText');
        
        harassmentTypeResult.innerHTML = `${offenseLabel}`;
        confidenceText.innerHTML = `Confidence: ${formatPercent(offenseConfidence)}% | Classification: ${severityLabel} (${formatPercent(severityConfidence)}%)`;
        
        // Update probability values
        document.getElementById('probPhyVal').innerHTML = formatProb(offenseProbs["Physical Harassment"] || 0);
        document.getElementById('probVerbVal').innerHTML = formatProb(offenseProbs["Verbal Harassment"] || 0);
        document.getElementById('probNonvVal').innerHTML = formatProb(offenseProbs["Non-Verbal Harassment"] || 0);
        // CHANGED: "Not Harassment" -> "Not Sexual Harassment"
        document.getElementById('probNotVal').innerHTML = formatProb(offenseProbs["Not Sexual Harassment"] || 0);
        document.getElementById('probCybVal').innerHTML = formatProb(offenseProbs["Cyber Sexual Harassment"] || 0);
        
        // Update progress bars
        document.getElementById('probPhyBar').style.width = (offenseProbs["Physical Harassment"] * 100) + '%';
        document.getElementById('probVerbBar').style.width = (offenseProbs["Verbal Harassment"] * 100) + '%';
        document.getElementById('probNonvBar').style.width = (offenseProbs["Non-Verbal Harassment"] * 100) + '%';
        // CHANGED: "Not Harassment" -> "Not Sexual Harassment"
        document.getElementById('probNotBar').style.width = (offenseProbs["Not Sexual Harassment"] * 100) + '%';
        document.getElementById('probCybBar').style.width = (offenseProbs["Cyber Sexual Harassment"] * 100) + '%';
        
        // Update description
        const shortDesc = descriptionText.length > 280 ? descriptionText.substring(0, 277) + '...' : descriptionText;
        document.getElementById('resultDescription').innerHTML = `“${escapeHtml(shortDesc)}”`;
        
        // Add classification badge (renamed)
        addClassificationBadge(severityLabel, severityConfidence);
        
        // Store AI result for later use
        currentAiResult = {
            category: offenseLabel,
            severity: severityLabel
        };
        
        // Map laws with the AI result
        mapLawsWithAI();
    }

    // Map laws using the stored AI result
    function mapLawsWithAI() {
        if (window.LawMapper && window.LawMapper.analyzeAndDisplayLaws && currentAiResult) {
            window.LawMapper.analyzeAndDisplayLaws(currentAiResult);
        } else if (!window.LawMapper) {
            console.warn('LawMapper not loaded yet');
        }
    }

    // Simple escape to prevent XSS
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

    // Show error message
    function showError(message) {
        const errorDiv = document.getElementById('errorMessage');
        errorDiv.innerHTML = `<i class="fas fa-exclamation-triangle mr-2"></i> ${escapeHtml(message)}`;
        errorDiv.classList.remove('hidden');
        setTimeout(() => {
            errorDiv.classList.add('hidden');
        }, 5000);
    }

    // Loading state
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

    // Call backend API
    async function callHarassmentAPI(description) {
        const API_URL = '/api/predict';
        // const API_URL = 'http://178.128.114.206/predict';
        
        const requestBody = {
            description: description
        };
        
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
        
        // Validate expected fields
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

    // Validate form fields before submission
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
                    if (data[0][i][0]) {
                        translatedText += data[0][i][0];
                    }
                }
                return translatedText || text;
            }
            return text;
        } catch (error) {
            console.warn('Translation failed:', error);
            return text;
        }
    }

    // Handle form submission
    document.getElementById('reportForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const description = document.getElementById('incident-description').value.trim();
        const resultPanel = document.getElementById('resultPanel');
        const errorDiv = document.getElementById('errorMessage');
        
        // Hide previous error
        errorDiv.classList.add('hidden');
        
        if (!description) {
            showError('Please describe the incident before submitting.');
            return;
        }
        
        // Validate legal context fields
        if (!validateForm()) {
            return;
        }
        
        // Show loading state
        setLoading(true);
        
        try {
            const translatedDescription = await translateToEnglish(description);
            console.log("Translated Text: ", translatedDescription);

            // Call actual API endpoint
            const apiResult = await callHarassmentAPI(translatedDescription);
            
            // Update UI with real classification
            updateResultUI(apiResult, description);
            
            // Show result panel
            resultPanel.classList.remove('hidden');
            
            // Smooth scroll to result
            resultPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            
        } catch (error) {
            console.error('Classification error:', error);
            showError(`Classification failed: ${error.message}. Make sure the backend server is running at http://178.128.114.206/predict`);
            resultPanel.classList.add('hidden');
        } finally {
            setLoading(false);
        }
    });

    // Reset/Clear button
    document.getElementById('resetBtn').addEventListener('click', function() {
        document.getElementById('incident-description').value = '';
        document.getElementById('resultPanel').classList.add('hidden');
        document.getElementById('errorMessage').classList.add('hidden');
        
        // Reset radio buttons
        const victimRadio = document.querySelectorAll('input[name="victimUP"]');
        const perpRadio = document.querySelectorAll('input[name="perpUP"]');
        victimRadio.forEach(radio => radio.checked = false);
        perpRadio.forEach(radio => radio.checked = false);
        
        // Reset selects to placeholder
        const victimSelect = document.getElementById('victimClass');
        const perpSelect = document.getElementById('perpClass');
        const relationshipSelect = document.getElementById('relationship');
        const locationSelect = document.getElementById('incidentLocation');
        
        if (victimSelect) victimSelect.value = '';
        if (perpSelect) perpSelect.value = '';
        if (relationshipSelect) relationshipSelect.value = '';
        if (locationSelect) locationSelect.value = '';
        
        // Clear classification badge container (new ID)
        const classificationContainer = document.getElementById('classificationLevelContainer');
        if (classificationContainer) {
            classificationContainer.innerHTML = '';
        }
        
        // Clear laws container
        const lawsContainer = document.getElementById('applicableLawsContainer');
        if (lawsContainer) {
            lawsContainer.innerHTML = '<!-- Laws will be populated here -->';
        }
        
        // Clear stored AI result
        currentAiResult = null;
    });

    // Listen for relationship options updates to re-map laws if needed
    document.addEventListener('relationshipOptionsUpdated', function() {
        const resultPanel = document.getElementById('resultPanel');
        if (resultPanel && !resultPanel.classList.contains('hidden') && currentAiResult) {
            mapLawsWithAI();
        }
    });
    
    document.addEventListener('complainedOptionsUpdated', function() {
        const resultPanel = document.getElementById('resultPanel');
        if (resultPanel && !resultPanel.classList.contains('hidden') && currentAiResult) {
            mapLawsWithAI();
        }
    });
    
    // Also listen for changes to form fields to update laws dynamically
    const formFields = ['victimClass', 'perpClass', 'relationship', 'incidentLocation'];
    formFields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field) {
            field.addEventListener('change', function() {
                const resultPanel = document.getElementById('resultPanel');
                if (resultPanel && !resultPanel.classList.contains('hidden') && currentAiResult) {
                    mapLawsWithAI();
                }
            });
        }
    });
    
    // Listen for radio button changes
    const victimRadios = document.querySelectorAll('input[name="victimUP"]');
    const perpRadios = document.querySelectorAll('input[name="perpUP"]');
    
    victimRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            const resultPanel = document.getElementById('resultPanel');
            if (resultPanel && !resultPanel.classList.contains('hidden') && currentAiResult) {
                mapLawsWithAI();
            }
        });
    });
    
    perpRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            const resultPanel = document.getElementById('resultPanel');
            if (resultPanel && !resultPanel.classList.contains('hidden') && currentAiResult) {
                mapLawsWithAI();
            }
        });
    });

    console.log('Report.js initialized');
})();