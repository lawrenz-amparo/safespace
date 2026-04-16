// report.js
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

// Campus locations (same as before)
const campusLocations = [
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
    "CEM Main Building",
    "CEM Graduate Building",
    "ACCI (Agricultural Credit and Cooperatives Institute)",
    "College of Development Communication (CDC Building)",
    "CDC Auditorium",
    "CEAT Main Building",
    "Electrical Engineering Building",
    "Mechanical Engineering Building",
    "Agricultural & Biosystems Engineering Building",
    "Civil Engineering area structures",
    "College of Veterinary Medicine Main Building (CVM Complex)",
    "Veterinary Teaching Hospital",
    "Diagnostic Laboratories",
    "CFNR Main Building / Administration",
    "Wood Science Building",
    "Forest Products Research buildings",
    "UPLB Museum of Natural History",
    "SEARCA",
    "BIOTECH (National Institute of Molecular Biology & Biotechnology)",
    "Dairy Training and Research Institute (DTRI)",
    "Philippine Carabao Center (UPLB unit)",
    "UPLB Rural High School",
    "UPLB Elementary School",
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
const exactLocationContainer = exactLocationSelect?.parentElement;

function populateExactLocations() {
    if (!exactLocationSelect) return;
    exactLocationSelect.innerHTML = '<option value="" disabled selected>— Select exact location —</option>';
    campusLocations.forEach(loc => {
        const opt = document.createElement('option');
        opt.value = loc;
        opt.textContent = loc;
        exactLocationSelect.appendChild(opt);
    });
    const other = document.createElement('option');
    other.value = "other";
    other.textContent = "Other (Please specify)";
    exactLocationSelect.appendChild(other);
}

function toggleExactLocation() {
    if (!locationSelect || !exactLocationContainer) return;
    if (locationSelect.value === "Inside the campus") {
        exactLocationContainer.style.display = "block";
        if (exactLocationSelect) exactLocationSelect.required = true;
        if (exactLocationSelect && exactLocationSelect.options.length <= 1) populateExactLocations();
    } else {
        exactLocationContainer.style.display = "none";
        if (exactLocationSelect) exactLocationSelect.required = false;
        if (exactLocationSelect) exactLocationSelect.value = "";
    }
}

function handleOtherLocation() {
    if (!exactLocationSelect) return;
    if (exactLocationSelect.value === "other") {
        let otherInput = document.getElementById('otherLocationInput');
        if (!otherInput) {
            otherInput = document.createElement('input');
            otherInput.type = 'text';
            otherInput.id = 'otherLocationInput';
            otherInput.placeholder = 'Please specify the exact location';
            otherInput.className = 'form-input mt-2';
            otherInput.required = exactLocationSelect.required;
            exactLocationSelect.parentNode.insertBefore(otherInput, exactLocationSelect.nextSibling);
        } else {
            otherInput.style.display = 'block';
        }
    } else {
        const otherInput = document.getElementById('otherLocationInput');
        if (otherInput) otherInput.style.display = 'none';
    }
}

if (locationSelect) locationSelect.addEventListener('change', toggleExactLocation);
if (exactLocationSelect) exactLocationSelect.addEventListener('change', handleOtherLocation);
toggleExactLocation();

// Dropdown options
const CLASSIFICATION_OPTIONS = [
    { value: "Student", text: "Student" },
    { value: "instructor/professor", text: "Instructor/Professor" },
    { value: "non-teaching personnel (admin & reps)", text: "Non-Teaching Personnel (Admin & Reps)" },
    { value: "Alumni", text: "Alumni" },
    { value: "non-UP/outsider", text: "Non-UP/Outsider" }
];

const RELATIONSHIP_OPTIONS = [
    { value: "student", text: "Student" },
    { value: "professor", text: "Professor" },
    { value: "colleague", text: "Colleague" },
    { value: "classmate", text: "Classmate" },
    { value: "orgmate", text: "Orgmate" },
    { value: "friend", text: "Friend" },
    { value: "outsider/stranger", text: "Outsider/Stranger" },
    { value: "with moral ascendancy", text: "With Moral Ascendancy" },
    { value: "with intimate", text: "With Intimate Relationship (e.g. Boyfriend/Girldfriend, Husband/Wife)" }
];

function updateComplainedClassificationOptions() {
    const select = document.getElementById('complainedClassification');
    if (!select) return;
    select.innerHTML = '<option value="">Select classification</option>';
    CLASSIFICATION_OPTIONS.forEach(opt => {
        const option = document.createElement('option');
        option.value = opt.value;
        option.textContent = opt.text;
        select.appendChild(option);
    });
}

function updateRelationshipOptions() {
    const select = document.getElementById('relationshipType');
    if (!select) return;
    select.innerHTML = '<option value="">Select relationship type</option>';
    RELATIONSHIP_OPTIONS.forEach(opt => {
        const option = document.createElement('option');
        option.value = opt.value;
        option.textContent = opt.text;
        select.appendChild(option);
    });
}

function collectFormData() {
    const victimConstituent = document.querySelector('input[name="victimConstituent"]:checked');
    const complainedConstituent = document.querySelector('input[name="complainedConstituent"]:checked');
    return {
        firstName: document.getElementById('firstName')?.value.trim() || '',
        middleName: document.getElementById('middleName')?.value.trim() || '',
        lastName: document.getElementById('lastName')?.value.trim() || '',
        age: document.getElementById('age')?.value || '',
        biologicalSex: document.getElementById('biologicalSex')?.value || '',
        identifiedAs: document.getElementById('identifiedAs')?.value || '',
        civilStatus: document.getElementById('civilStatus')?.value || '',
        mobileNumber: document.getElementById('mobileNumber')?.value.trim() || '',
        landLineNumber: document.getElementById('landLineNumber')?.value.trim() || '',
        presentAddress: document.getElementById('presentAddress')?.value.trim() || '',
        permanentAddress: document.getElementById('permanentAddress')?.value.trim() || '',
        classification: document.getElementById('classification')?.value || '',
        college: document.getElementById('college')?.value.trim() || '',
        department: document.getElementById('department')?.value.trim() || '',
        victimConstituent: victimConstituent ? victimConstituent.value : '',
        complainedFullName: document.getElementById('complainedFullName')?.value.trim() || '',
        complainedSex: document.getElementById('complainedSex')?.value || '',
        complainedClassification: document.getElementById('complainedClassification')?.value || '',
        complainedCollege: document.getElementById('complainedCollege')?.value.trim() || '',
        complainedDepartment: document.getElementById('complainedDepartment')?.value.trim() || '',
        complainedConstituent: complainedConstituent ? complainedConstituent.value : '',
        complainedInsideCampus: document.getElementById('complainedInsideCampus')?.value || '',
        complainedExactLocation: document.getElementById('complainedExactLocation')?.value || '',
        relationshipType: document.getElementById('relationshipType')?.value || '',
        complainantStory: document.getElementById('complainantStory')?.value.trim() || '',
        complainedIncidentHappened: document.getElementById('complainedIncidentHappened')?.value.trim() || '',
        procedureType: document.getElementById('procedureType')?.value || '',
        remarks: document.getElementById('remarks')?.value.trim() || '',
        incidentDate: document.getElementById('incidentDate')?.value || '',
        incidentTime: document.getElementById('incidentTime')?.value || ''
    };
}

function validateForm(data) {
    const required = [
        'firstName', 'middleName', 'lastName', 'age', 'biologicalSex', 'identifiedAs',
        'civilStatus', 'mobileNumber', 'presentAddress', 'permanentAddress',
        'classification', 'victimConstituent',
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
                permanentAddress: 'Permanent address', classification: 'Complainant Classification',
                victimConstituent: 'Complainant is UP Constituent',
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
    const confirmAccuracy = document.getElementById('confirmAccuracy')?.checked;
    const confirmConfidentiality = document.getElementById('confirmConfidentiality')?.checked;
    const confirmAppointment = document.getElementById('confirmAppointment')?.checked;
    if (!confirmAccuracy || !confirmConfidentiality || !confirmAppointment) {
        toast.warning('Confirmation required', 'Please confirm all three agreements to proceed.');
        return false;
    }
    return true;
}

function updateApplicableLaws() {
    const formData = collectFormData();
    if (formData.victimConstituent && formData.complainedConstituent && formData.relationshipType && formData.complainedClassification) {
        if (window.LawMapper && window.LawMapper.determineApplicableLaws) {
            const result = window.LawMapper.determineApplicableLaws(formData, null);
            if (window.LawMapper.displayApplicableLaws) {
                window.LawMapper.displayApplicableLaws(result.applicableLaws, result.externalAssistance, result.recommendedAction, null, formData);
            }
        }
    } else {
        const lawsContainer = document.getElementById('applicableLawsContainer');
        if (lawsContainer) lawsContainer.style.display = 'none';
    }
}

async function predictHarassment(description) {
    try {
        const response = await fetch('http://178.128.114.206/predict', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify({ description })
        });
        if (!response.ok) throw new Error('Prediction API request failed');
        const data = await response.json();
        return {
            offenseLabel: data.offense.label,
            offenseConfidence: data.offense.confidence,
            severityLabel: data.severity.label,
            severityConfidence: data.severity.confidence
        };
    } catch (error) {
        console.error('Prediction error:', error);
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
            let translated = '';
            for (let i = 0; i < data[0].length; i++) {
                if (data[0][i][0]) translated += data[0][i][0];
            }
            return translated || text;
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
    if (!validateForm(formData)) return;
    if (window.LawMapper && window.LawMapper.determineApplicableLaws) {
        const result = window.LawMapper.determineApplicableLaws(formData, null);
        formData.applicableLaws = result.applicableLaws;
    } else {
        formData.applicableLaws = [];
    }
    const submitBtn = document.getElementById('submitReportBtn');
    const saveDraftBtn = document.getElementById('saveDraftBtn');
    submitBtn.disabled = true;
    saveDraftBtn.disabled = true;
    const originalHTML = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Analyzing report...';
    try {
        const translated = await translateToEnglish(formData.complainantStory);
        const prediction = await predictHarassment(translated);
        if (prediction) {
            formData.predictedOffense = prediction.offenseLabel;
            formData.predictedOffenseConfidence = prediction.offenseConfidence;
            formData.predictedSeverity = prediction.severityLabel;
            formData.predictedSeverityConfidence = prediction.severityConfidence;
        } else {
            formData.predictedOffense = 'Not Available';
            formData.predictedOffenseConfidence = 0;
            formData.predictedSeverity = 'Not Available';
            formData.predictedSeverityConfidence = 0;
            toast.warning('Prediction service unavailable', 'Continuing without AI analysis.');
        }
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
            if (lawsContainer) lawsContainer.style.display = 'none';
        } else {
            toast.error('Submission failed', data.message || 'Failed to submit report.');
        }
    } catch (error) {
        console.error('Submission error:', error);
        toast.error('Connection error', 'Unable to connect to server.');
    } finally {
        submitBtn.disabled = false;
        saveDraftBtn.disabled = false;
        submitBtn.innerHTML = originalHTML;
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
        if (document.getElementById('incidentDate') && formData.incidentDate)
            document.getElementById('incidentDate').value = formData.incidentDate;
        if (document.getElementById('incidentTime') && formData.incidentTime)
            document.getElementById('incidentTime').value = formData.incidentTime;
        updateApplicableLaws();
        toast.info('Draft loaded', 'Your saved draft has been loaded.');
    }
}

document.getElementById('reportForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    await submitReport();
});
document.getElementById('saveDraftBtn')?.addEventListener('click', saveDraft);
document.getElementById('logoutBtn')?.addEventListener('click', (e) => {
    e.preventDefault();
    handleLogout();
});
document.getElementById('mobileLogoutBtn')?.addEventListener('click', (e) => {
    e.preventDefault();
    handleLogout();
});
document.getElementById('classification')?.addEventListener('change', () => {
    updateComplainedClassificationOptions();
    updateRelationshipOptions();
    updateApplicableLaws();
});
document.querySelectorAll('input[name="victimConstituent"], input[name="complainedConstituent"]').forEach(radio => {
    radio.addEventListener('change', () => updateApplicableLaws());
});
document.getElementById('relationshipType')?.addEventListener('change', updateApplicableLaws);
document.getElementById('complainedClassification')?.addEventListener('change', updateApplicableLaws);

if (checkAuth()) {
    updateComplainedClassificationOptions();
    updateRelationshipOptions();
    loadDraft();
}