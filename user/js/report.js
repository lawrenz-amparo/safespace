// Configure physics toast
if (typeof toast !== 'undefined') {
    toast.defaults = {
        position: 'top-right',
        duration: 4000,
        showProgress: true,
        pauseOnHover: true,
        spring: true
    };
}

function getAuthToken() {
    return localStorage.getItem('token') || sessionStorage.getItem('token');
}

function updateUserInfo() {
    const token = getAuthToken();
    if (token) {
        document.getElementById('sidebarUserName').textContent = 'User';
        document.getElementById('sidebarUserEmail').textContent = 'user@uplb.edu.ph';
    } else {
        document.getElementById('sidebarUserName').textContent = 'Not logged in';
        document.getElementById('sidebarUserEmail').textContent = 'Please login';
    }
}

function handleLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('role');
    toast.success('Logged out', 'You have been successfully logged out.');
    setTimeout(() => {
        window.location.href = '/login.html';
    }, 1500);
}

function checkAuth() {
    const token = getAuthToken();
    if (!token) {
        toast.warning('Authentication required', 'Please log in to file a report.');
        setTimeout(() => {
            window.location.href = '/login.html';
        }, 2000);
        return false;
    }
    return true;
}

const campusLocations = [
    // College of Arts and Sciences (CAS) & General Academic Units
    "Physical Sciences Building (PhySci / PS / PSC)",
    "Biological Sciences Building (BioSci / IBS)",
    "Mathematics Building",
    "CAS Building (Old Humanities)",
    "CAS Annex 1 (A1)",
    "CAS Annex 2 (A2 / Old Chem)",
    "New CAS Building / CAS Complex (NCAS)",
    "Chemistry Building (New Chem)",
    "ICS Building (within PhySci complex)",
    "IBS Lecture Hall (IBSLH)",
    "Physical Science Lecture Halls (PSLH A, B, C)",
    "Humanities Building",
    
    // Administrative & General Purpose Buildings
    "Abelardo G. Samonte Hall (AGS / Ag. Samonte Hall)",
    "D.L. Umali Hall",
    "Student Union Building (SU)",
    "Baker Memorial Hall",
    "UPLB Main Library",
    "Graduate School Building",
    "Office of Student Affairs (OSA)",
    "University Registrar",
    "UPLB Gate / Guardhouse",
    "University Health Service",
    
    // College of Agriculture and Food Science (CAFS)
    "Institute of Plant Breeding (IPB complex)",
    "IPB Admin Building",
    "IPB Biotechnology Building",
    "IPB Module A",
    "IPB Module B",
    "IPB Module C",
    "Screenhouses / greenhouses",
    "National Crop Protection Center (NCPC)",
    "Institute of Crop Science (ICropS)",
    "Institute of Animal Science (IAS)",
    "Institute of Food Science and Technology (IFST)",
    "Agricultural Systems Institute (ASI)",
    "Institute of Weed Science, Entomology & Plant Pathology (IWEP)",
    "Animal housing & experimental farms",
    
    // College of Economics and Management (CEM)
    "CEM Main Building",
    "CEM Graduate Building",
    "ACCI (Agricultural Credit and Cooperatives Institute)",
    
    // College of Development Communication (CDC)
    "College of Development Communication (CDC Building)",
    "CDC Auditorium",
    
    // College of Engineering and Agro-Industrial Technology (CEAT)
    "CEAT Main Building",
    "Electrical Engineering Building",
    "Mechanical Engineering Building",
    "Agricultural & Biosystems Engineering Building",
    "Civil Engineering area structures",
    
    // College of Veterinary Medicine (CVM)
    "College of Veterinary Medicine Main Building (CVM Complex)",
    "Veterinary Teaching Hospital",
    "Diagnostic Laboratories",
    
    // College of Forestry and Natural Resources (CFNR)
    "CFNR Main Building / Administration",
    "Wood Science Building",
    "Forest Products Research buildings",
    
    // Other Institutes & Research Centers
    "UPLB Museum of Natural History",
    "SEARCA",
    "BIOTECH (National Institute of Molecular Biology & Biotechnology)",
    "Dairy Training and Research Institute (DTRI)",
    "Philippine Carabao Center (UPLB unit)",
    
    // Schools
    "UPLB Rural High School",
    "UPLB Elementary School",
    
    // Residence Halls & Housing
    "Men's Residence Hall",
    "Women's Residence Hall",
    "New Dormitory (co-ed)",
    "International House (IH)",
    "Graduate School Dormitory / Grad House",
    "Centennial Residence Hall (Centen)",
    "Forestry Residence Hall (Foreha / Foreha)",
    "New Integrated Dormitory",
    "Upper Campus Dorms (clustered housing units)",
    "Staff Housing / UPLB Housing Areas",
    "SEARCA Residence / Guest Housing",
    "Researcher / Visiting Scholar Housing",
    
    // Outdoor Areas & Parking
    "Pili Drive",
    "Freedom Park",
    "Oblation Park",
    "Carabao Park",
    "Baker Hall Field",
    "CEM Parking Area",
    "CDC Parking Area",
    "SU Parking",
    "Baker Hall Parking",
    "Main Library Parking",
    "CEAT Parking zones",
    "Forestry parking areas"
];

const locationSelect = document.getElementById('complainedInsideCampus');
const exactLocationSelect = document.getElementById('complainedExactLocation');
const exactLocationContainer = exactLocationSelect.parentElement;

function populateExactLocations() {
    exactLocationSelect.innerHTML = '<option value="" disabled selected>— Select exact location —</option>';
    
    campusLocations.forEach(location => {
        const option = document.createElement('option');
        option.value = location;
        option.textContent = location;
        exactLocationSelect.appendChild(option);
    });
    
    // Add option for "Other" with text input
    const otherOption = document.createElement('option');
    otherOption.value = "other";
    otherOption.textContent = "Other (Please specify)";
    exactLocationSelect.appendChild(otherOption);
}

function toggleExactLocation() {
    const selectedValue = locationSelect.value;
    
    if (selectedValue === "Inside the campus") {
        exactLocationContainer.style.display = "block";
        exactLocationSelect.required = true;
        
        // Populate locations if not already populated
        if (exactLocationSelect.options.length <= 1) {
            populateExactLocations();
        }
    } else {
        exactLocationContainer.style.display = "none";
        exactLocationSelect.required = false;
        exactLocationSelect.value = "";
    }
}

function handleOtherLocation() {
    if (exactLocationSelect.value === "other") {
        // Check if text input already exists
        let otherInput = document.getElementById('otherLocationInput');
        if (!otherInput) {
            otherInput = document.createElement('input');
            otherInput.type = 'text';
            otherInput.id = 'otherLocationInput';
            otherInput.placeholder = 'Please specify the exact location';
            otherInput.className = 'form-input mt-2';
            otherInput.required = exactLocationSelect.required;
            
            // Insert after the select element
            exactLocationSelect.parentNode.insertBefore(otherInput, exactLocationSelect.nextSibling);
        } else {
            otherInput.style.display = 'block';
        }
    } else {
        const otherInput = document.getElementById('otherLocationInput');
        if (otherInput) {
            otherInput.style.display = 'none';
            otherInput.value = '';
        }
    }
}

// Add event listeners
locationSelect.addEventListener('change', toggleExactLocation);
exactLocationSelect.addEventListener('change', handleOtherLocation);

// Initial state
toggleExactLocation();

// UPDATED: New classification options (same for both complainant and respondent)
const CLASSIFICATION_OPTIONS = [
    { value: "Student", text: "Student" },
    { value: "instructor/professor", text: "instructor/professor" },
    { value: "non-teaching personnel (admin & reps)", text: "non-teaching personnel (admin & reps)" },
    { value: "Alumni", text: "Alumni" },
    { value: "non-UP/outsider", text: "non-UP/outsider" }
];

// UPDATED: Static relationship options (no longer dependent on classification)
const RELATIONSHIP_OPTIONS = [
    { value: "student", text: "student" },
    { value: "professor", text: "professor" },
    { value: "colleague", text: "colleague" },
    { value: "classmate", text: "classmate" },
    { value: "orgmate", text: "orgmate" },
    { value: "friend", text: "friend" },
    { value: "outsider/stranger", text: "outsider/stranger" },
    { value: "with moral ascendancy", text: "with moral ascendancy" },
    { value: "with intimate", text: "with intimate" }
];

function updateComplainedClassificationOptions() {
    const complainedClassificationSelect = document.getElementById('complainedClassification');
    complainedClassificationSelect.innerHTML = '<option value="">Select classification</option>';
    
    CLASSIFICATION_OPTIONS.forEach(option => {
        const optionElement = document.createElement('option');
        optionElement.value = option.value;
        optionElement.textContent = option.text;
        complainedClassificationSelect.appendChild(optionElement);
    });
}

function updateRelationshipOptions() {
    const relationshipSelect = document.getElementById('relationshipType');
    relationshipSelect.innerHTML = '<option value="">Select relationship type</option>';
    
    RELATIONSHIP_OPTIONS.forEach(option => {
        const optionElement = document.createElement('option');
        optionElement.value = option.value;
        optionElement.textContent = option.text;
        relationshipSelect.appendChild(optionElement);
    });
}

function collectFormData() {
    const victimConstituentRadio = document.querySelector('input[name="victimConstituent"]:checked');
    const complainedConstituentRadio = document.querySelector('input[name="complainedConstituent"]:checked');
    
    return {
        firstName: document.getElementById('firstName').value.trim(),
        middleName: document.getElementById('middleName').value.trim(),
        lastName: document.getElementById('lastName').value.trim(),
        age: document.getElementById('age').value,
        biologicalSex: document.getElementById('biologicalSex').value,
        identifiedAs: document.getElementById('identifiedAs').value,
        civilStatus: document.getElementById('civilStatus').value,
        mobileNumber: document.getElementById('mobileNumber').value.trim(),
        landLineNumber: document.getElementById('landLineNumber').value.trim(),
        presentAddress: document.getElementById('presentAddress').value.trim(),
        permanentAddress: document.getElementById('permanentAddress').value.trim(),
        classification: document.getElementById('classification').value,
        college: document.getElementById('college').value.trim(),
        department: document.getElementById('department').value.trim(),
        victimConstituent: victimConstituentRadio ? victimConstituentRadio.value : '',
        complainedFullName: document.getElementById('complainedFullName').value.trim(),
        complainedSex: document.getElementById('complainedSex').value,
        complainedClassification: document.getElementById('complainedClassification').value,
        complainedCollege: document.getElementById('complainedCollege').value.trim(),
        complainedDepartment: document.getElementById('complainedDepartment').value.trim(),
        complainedConstituent: complainedConstituentRadio ? complainedConstituentRadio.value : '',
        complainedInsideCampus: document.getElementById('complainedInsideCampus').value,
        complainedExactLocation: document.getElementById('complainedExactLocation').value,
        relationshipType: document.getElementById('relationshipType').value,
        complainantStory: document.getElementById('complainantStory').value.trim(),
        complainedIncidentHappened: document.getElementById('complainedIncidentHappened').value.trim(),
        // REMOVED: complainedPhysicalAppearance field
        procedureType: document.getElementById('procedureType').value,
        remarks: document.getElementById('remarks').value.trim(),
        // REMOVED: whereDidYouHearAboutUs and otherWhereDidYouHearAboutUs
        incidentDate: document.getElementById('incidentDate').value,
        incidentTime: document.getElementById('incidentTime').value
    };
}

function validateForm(data) {
    const required = [
        'firstName', 'middleName', 'lastName', 'age', 'biologicalSex', 'identifiedAs',
        'civilStatus', 'mobileNumber', 'presentAddress', 'permanentAddress',
        'classification', 'college', 'department', 'victimConstituent',
        'complainedFullName', 'complainedSex', 'complainedClassification', 
        'complainedConstituent', 'complainedInsideCampus', 'relationshipType',
        'complainantStory', 'complainedIncidentHappened', 'procedureType'
    ];
    
    for (let field of required) {
        if (!data[field] || data[field] === '') {
            const fieldNames = {
                firstName: 'First name', middleName: 'Middle name', lastName: 'Last name',
                age: 'Age', biologicalSex: 'Biological sex', identifiedAs: 'Identified as',
                civilStatus: 'Civil status', mobileNumber: 'Mobile number', presentAddress: 'Present address',
                permanentAddress: 'Permanent address', classification: 'Classification', college: 'College',
                department: 'Department', victimConstituent: 'Complainant is UP Constituent',
                complainedFullName: 'Respondent full name', complainedSex: 'Respondent sex',
                complainedClassification: 'Respondent classification', complainedConstituent: 'Respondent is UP Constituent', 
                complainedInsideCampus: 'Incident location', relationshipType: 'Relationship with Respondent',
                complainantStory: 'Complainant story', complainedIncidentHappened: 'Event when incident happened',
                procedureType: 'Options to proceed'
            };
            toast.warning('Missing field', `${fieldNames[field] || field} is required`);
            return false;
        }
    }
    
    // Updated checkboxes (now three)
    const confirmAccuracy = document.getElementById('confirmAccuracy').checked;
    const confirmConfidentiality = document.getElementById('confirmConfidentiality').checked;
    const confirmAppointment = document.getElementById('confirmAppointment').checked;
    
    if (!confirmAccuracy || !confirmConfidentiality || !confirmAppointment) {
        toast.warning('Confirmation required', 'Please confirm all three agreements to proceed.');
        return false;
    }
    
    return true;
}

function updateApplicableLaws() {
    const formData = collectFormData();
    
    if (formData.victimConstituent && formData.complainedConstituent && formData.relationshipType && formData.complainedClassification) {
        const { applicableLaws } = determineApplicableLaws(formData);
        displayApplicableLaws(applicableLaws);
    } else {
        const lawsContainer = document.getElementById('applicableLawsContainer');
        if (lawsContainer) {
            lawsContainer.style.display = 'none';
        }
    }
}

async function predictHarassment(description) {
    try {
        const response = await fetch('/api/predict', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify({
                description: description
            })
        });
        
        if (!response.ok) {
            throw new Error('Prediction API request failed');
        }        
        const predictionData = await response.json();
        return {
            offenseLabel: predictionData.offense.label,
            offenseConfidence: predictionData.offense.confidence,
            severityLabel: predictionData.severity.label,
            severityConfidence: predictionData.severity.confidence
        };
    } catch (error) {
        console.error('Error calling prediction API:', error);
        return null;
    }
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

async function submitReport() {
    const token = getAuthToken();
    if (!token) {
        toast.error('Not authenticated', 'Please log in to submit a report.');
        window.location.href = '/login.html';
        return;
    }
    
    const formData = collectFormData();
    
    if (!validateForm(formData)) {
        return;
    }
    
    const { applicableLaws } = determineApplicableLaws(formData);
    formData.applicableLaws = applicableLaws;
    
    // Add loading indicator for prediction
    const submitBtn = document.getElementById('submitReportBtn');
    const saveDraftBtn = document.getElementById('saveDraftBtn');
    
    submitBtn.disabled = true;
    saveDraftBtn.disabled = true;
    const originalSubmitHTML = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Analyzing report...';
    
    try {
        const translatedDescription = await translateToEnglish(formData.complainantStory);
        console.log("Translated Text From User", translatedDescription);

        // Call prediction API first
        const predictionResult = await predictHarassment(translatedDescription);
        
        if (predictionResult) {
            formData.predictedOffense = predictionResult.offenseLabel;
            formData.predictedOffenseConfidence = predictionResult.offenseConfidence;
            formData.predictedSeverity = predictionResult.severityLabel;
            formData.predictedSeverityConfidence = predictionResult.severityConfidence;
        } else {
            // Set default values if prediction fails
            formData.predictedOffense = 'Not Available';
            formData.predictedOffenseConfidence = 0;
            formData.predictedSeverity = 'Not Available';
            formData.predictedSeverityConfidence = 0;
            toast.warning('Prediction service unavailable', 'Continuing with report submission without AI analysis.');
        }
        
        // Update button text for actual submission
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';
        
        const response = await fetch('https://safespace-back.onrender.com/api/v1/user/report', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(formData)
        });
        
        const data = await response.json();
        
        if (response.ok) {
            toast.success('Report submitted!', 'Your report has been successfully filed.');
            document.getElementById('reportForm').reset();
            document.getElementById('confirmAccuracy').checked = false;
            document.getElementById('confirmConfidentiality').checked = false;
            document.getElementById('confirmAppointment').checked = false;
            
            const radioGroups = ['victimConstituent', 'complainedConstituent', 'complainedInsideCampus'];
            radioGroups.forEach(group => {
                const radios = document.querySelectorAll(`input[name="${group}"]`);
                radios.forEach(radio => radio.checked = false);
            });
            
            const lawsContainer = document.getElementById('applicableLawsContainer');
            if (lawsContainer) {
                lawsContainer.style.display = 'none';
            }
        } else {
            let errorMsg = data.message || 'Failed to submit report. Please try again.';
            toast.error('Submission failed', errorMsg);
        }
    } catch (error) {
        console.error('Report submission error:', error);
        toast.error('Connection error', 'Unable to connect to the server. Please check your connection.');
    } finally {
        submitBtn.disabled = false;
        saveDraftBtn.disabled = false;
        submitBtn.innerHTML = originalSubmitHTML;
    }
}

function saveDraft() {
    const formData = collectFormData();
    localStorage.setItem('reportDraft', JSON.stringify(formData));
    toast.info('Draft saved', 'Your report has been saved as a draft.');
}

function loadDraft() {
    const draft = localStorage.getItem('reportDraft');
    if (draft) {
        const formData = JSON.parse(draft);
        
        Object.keys(formData).forEach(key => {
            const element = document.getElementById(key);
            if (element) {
                if (element.type === 'radio') {
                    const radio = document.querySelector(`input[name="${key}"][value="${formData[key]}"]`);
                    if (radio) radio.checked = true;
                } else {
                    element.value = formData[key] || '';
                }
            }
        });
        
        // Explicitly set incident date/time
        if (document.getElementById('incidentDate') && formData.incidentDate) {
            document.getElementById('incidentDate').value = formData.incidentDate;
        }
        if (document.getElementById('incidentTime') && formData.incidentTime) {
            document.getElementById('incidentTime').value = formData.incidentTime;
        }
        
        updateApplicableLaws();
        toast.info('Draft loaded', 'Your saved draft has been loaded.');
    }
}

document.getElementById('reportForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    await submitReport();
});

document.getElementById('saveDraftBtn').addEventListener('click', () => {
    saveDraft();
});

document.getElementById('logoutBtn').addEventListener('click', (e) => {
    e.preventDefault();
    handleLogout();
});

document.getElementById('mobileLogoutBtn').addEventListener('click', (e) => {
    e.preventDefault();
    handleLogout();
});

// REMOVED: whereDidYouHearAboutUs event listener (field removed)

document.getElementById('classification').addEventListener('change', () => {
    updateComplainedClassificationOptions();
    updateRelationshipOptions();
    updateApplicableLaws();
});

document.querySelectorAll('input[name="victimConstituent"], input[name="complainedConstituent"]').forEach(radio => {
    radio.addEventListener('change', () => {
        updateApplicableLaws();
    });
});

document.getElementById('relationshipType').addEventListener('change', () => {
    updateApplicableLaws();
});

document.getElementById('complainedClassification').addEventListener('change', () => {
    updateApplicableLaws();
});

if (checkAuth()) {
    updateUserInfo();
    updateComplainedClassificationOptions();
    updateRelationshipOptions();
    loadDraft();
}