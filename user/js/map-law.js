// map-law.js
(function() {
    'use strict';

    function determineApplicableLaws(data) {
        const {
            classification,
            victimConstituent,
            complainedClassification,
            complainedConstituent,
            relationshipType
        } = data;
        
        let applicableLaws = [];
        
        // --- Victim is a Student ---
        if (classification === 'Student') {
            if (victimConstituent === 'Yes' || victimConstituent === 'No') {
                const validPerpClasses = [
                    'Student', 'Professor', 'Instructor', 'Teacher',
                    "Gov't Employee", 'Stranger'
                ];
                if (validPerpClasses.includes(complainedClassification)) {
                    if (complainedConstituent === 'Yes') {
                        if (relationshipType === 'classmate' || relationshipType === 'orgmate') {
                            applicableLaws = ['RA 11313', 'OASH Code for Students'];
                        }
                        else if (relationshipType === 'student_to_faculty') {
                            applicableLaws = ['RA 11313', 'RACCS', 'RA 7877', 'OASH Code for Employees'];
                        }
                        else if (relationshipType === 'intimate') {
                            applicableLaws = ['RA 11313', 'RA 9262 (If victim is a woman/child)', 'OASH Code for Students'];
                        }
                        else if (relationshipType === 'authority') {
                            applicableLaws = ['RA 11313', 'RACCS', 'RA 7877', 'OASH Code for Employees'];
                        }
                        else if (relationshipType === 'stranger') {
                            applicableLaws = ['RA 11313', 'If UP student, OASH Code for Students', 'If UP employee, OASH Code for Employees'];
                        }
                        else {
                            applicableLaws = ['RA 11313'];
                        }
                    }
                    else if (complainedConstituent === 'No') {
                        if (relationshipType === 'classmate' || relationshipType === 'orgmate') {
                            applicableLaws = ['RA 11313', 'Contact details of SSO'];
                        }
                        else if (relationshipType === 'student_to_faculty') {
                            applicableLaws = ['RA 11313', 'RACCS', 'RA 7877', 'Contact details of SSO'];
                        }
                        else if (relationshipType === 'intimate') {
                            applicableLaws = ['RA 11313', 'RA 9262 (If victim is a woman/child)', 'Contact details of SSO'];
                        }
                        else if (relationshipType === 'authority') {
                            applicableLaws = ['RA 11313', 'RACCS', 'RA 7877', 'Contact details of SSO'];
                        }
                        else if (relationshipType === 'stranger') {
                            applicableLaws = ['RA 11313', 'Contact details of SSO'];
                        }
                        else {
                            applicableLaws = ['RA 11313', 'Contact details of SSO'];
                        }
                    }
                } else {
                    applicableLaws = ['Invalid complained classification'];
                }
            }
        } 
        // --- Victim is NOT a Student (e.g., Professor, Employee, etc.) ---
        else {
            if (victimConstituent === 'Yes' || victimConstituent === 'No') {
                const validPerpClasses = [
                    'Co-worker', 'Colleague', "Gov't Employee", 'Student', 'Stranger'
                ];
                if (validPerpClasses.includes(complainedClassification)) {
                    if (complainedConstituent === 'Yes') {
                        // NEW: faculty/staff victim, student perpetrator
                        if (relationshipType === 'faculty_to_student') {
                            applicableLaws = ['RA 11313', 'RACCS', 'RA 7877', 'OASH Code for Students'];
                        }
                        else if (relationshipType === 'same-level') {
                            applicableLaws = ['RA 11313', 'RACCS', 'OASH Code for Employees'];
                        }
                        else if (relationshipType === 'staff_to_supervisor') {
                            applicableLaws = ['RA 11313', 'RACCS', 'RA 7877', 'OASH Code for Employees'];
                        }
                        else if (relationshipType === 'authority') {
                            applicableLaws = ['RA 11313', 'RACCS', 'RA 7877', 'OASH Code for Employees'];
                        }
                        else if (relationshipType === 'intimate') {
                            applicableLaws = ['RA 11313', 'RA 9262 (If victim is a woman/child)', 'RACCS', 'OASH Code for Employees'];
                        }
                        else if (relationshipType === 'none') {
                            applicableLaws = ['RA 11313', 'OASH Code for Students'];
                        }
                        else if (relationshipType === 'stranger') {
                            applicableLaws = ['RA 11313', 'If UP student, OASH Code for Students', 'If UP employee, OASH Code for Employees'];
                        }
                        else {
                            applicableLaws = ['RA 11313'];
                        }
                    }
                    else if (complainedConstituent === 'No') {
                        if (relationshipType === 'faculty_to_student') {
                            applicableLaws = ['RA 11313', 'RACCS', 'RA 7877', 'Contact details of SSO'];
                        }
                        else if (relationshipType === 'same-level') {
                            applicableLaws = ['RA 11313', 'RACCS', 'Contact details of SSO'];
                        }
                        else if (relationshipType === 'staff_to_supervisor') {
                            applicableLaws = ['RA 11313', 'RACCS', 'RA 7877', 'Contact details of SSO'];
                        }
                        else if (relationshipType === 'authority') {
                            applicableLaws = ['RA 11313', 'RACCS', 'RA 7877', 'Contact details of SSO'];
                        }
                        else if (relationshipType === 'intimate') {
                            applicableLaws = ['RA 11313', 'RA 9262 (If victim is a woman/child)', 'RACCS', 'Contact details of SSO'];
                        }
                        else if (relationshipType === 'none') {
                            applicableLaws = ['RA 11313', 'Contact details of SSO'];
                        }
                        else if (relationshipType === 'stranger') {
                            applicableLaws = ['RA 11313', 'Contact details of SSO'];
                        }
                        else {
                            applicableLaws = ['RA 11313', 'Contact details of SSO'];
                        }
                    }
                } else {
                    applicableLaws = ['Invalid complained classification'];
                }
            }
        }
        
        applicableLaws = [...new Set(applicableLaws)];
        return { applicableLaws };
    }

    function displayApplicableLaws(applicableLaws) {
        let lawsContainer = document.getElementById('applicableLawsContainer');
        
        if (!lawsContainer) {
            lawsContainer = document.createElement('div');
            lawsContainer.id = 'applicableLawsContainer';
            lawsContainer.className = 'mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg';
            
            const relationshipSection = document.getElementById('relationship')?.closest('.grid');
            if (relationshipSection && relationshipSection.parentNode) {
                relationshipSection.parentNode.insertBefore(lawsContainer, relationshipSection.nextSibling);
            }
        }
        
        if (applicableLaws.length > 0) {
            lawsContainer.innerHTML = `
                <div class="flex items-start gap-3">
                    <i class="fas fa-gavel text-blue-600 text-xl mt-1"></i>
                    <div class="flex-1">
                        <h4 class="font-semibold text-blue-900 mb-2">Applicable Laws & Policies</h4>
                        <div class="space-y-2">
                            <div>
                                <p class="text-sm font-medium text-blue-800 mb-1">Legal Frameworks:</p>
                                <ul class="list-disc list-inside text-sm text-blue-700 space-y-1">
                                    ${applicableLaws.map(law => `<li>${law}</li>`).join('')}
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            lawsContainer.style.display = 'block';
        } else {
            lawsContainer.style.display = 'none';
        }
    }

    window.determineApplicableLaws = determineApplicableLaws;
    window.displayApplicableLaws = displayApplicableLaws;
})();