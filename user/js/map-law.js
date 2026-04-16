// map-law.js – updated with ASH Code and new dropdown support
(function() {
    'use strict';

    /**
     * Map new relationship values to internal categories
     */
    function mapRelationshipToInternal(relationshipType, isStudentVictim) {
        const mapping = {
            'student': 'classmate',           // student-student
            'professor': isStudentVictim ? 'student_to_faculty' : 'authority',
            'colleague': 'same-level',
            'classmate': 'classmate',
            'orgmate': 'orgmate',
            'friend': 'none',
            'outsider/stranger': 'stranger',
            'with moral ascendancy': 'authority',
            'with intimate': 'intimate'
        };
        return mapping[relationshipType] || 'none';
    }

    /**
     * Map new classification values to internal categories
     * For victim classification, we only care if it's 'Student' or not.
     * For perpetrator classification, we map to the old set used in logic.
     */
    function mapClassificationToInternal(classification, isPerpetrator = false) {
        if (!isPerpetrator) {
            // Victim classification: only need to know if student
            return classification === 'Student' ? 'Student' : 'NonStudent';
        } else {
            // Perpetrator classification: map to old values used in switch cases
            const perpMap = {
                'Student': 'Student',
                'instructor/professor': 'Professor',
                'non-teaching personnel (admin & reps)': "Gov't Employee",
                'Alumni': 'Stranger',        // Alumni treated as non-UP/outsider
                'non-UP/outsider': 'Stranger'
            };
            return perpMap[classification] || 'Stranger';
        }
    }

    function determineApplicableLaws(data) {
        const {
            classification,               // complainant classification
            victimConstituent,
            complainedClassification,
            complainedConstituent,
            relationshipType
        } = data;
        
        // Map to internal values
        const isStudentVictim = (classification === 'Student');
        const internalRelationship = mapRelationshipToInternal(relationshipType, isStudentVictim);
        const internalPerpClass = mapClassificationToInternal(complainedClassification, true);
        
        // Build a normalized data object for the existing logic
        const normalizedData = {
            classification: isStudentVictim ? 'Student' : 'NonStudent',
            victimConstituent: victimConstituent,
            complainedClassification: internalPerpClass,
            complainedConstituent: complainedConstituent,
            relationshipType: internalRelationship
        };
        
        let applicableLaws = [];
        
        // --- Victim is a Student ---
        if (normalizedData.classification === 'Student') {
            if (normalizedData.victimConstituent === 'Yes' || normalizedData.victimConstituent === 'No') {
                const validPerpClasses = [
                    'Student', 'Professor', 'Instructor', 'Teacher',
                    "Gov't Employee", 'Stranger'
                ];
                if (validPerpClasses.includes(normalizedData.complainedClassification)) {
                    if (normalizedData.complainedConstituent === 'Yes') {
                        if (normalizedData.relationshipType === 'classmate' || normalizedData.relationshipType === 'orgmate') {
                            applicableLaws = ['RA 11313', 'ASH Code for Students'];
                        }
                        else if (normalizedData.relationshipType === 'student_to_faculty') {
                            applicableLaws = ['RA 11313', 'RACCS', 'RA 7877', 'ASH Code for Employees'];
                        }
                        else if (normalizedData.relationshipType === 'intimate') {
                            applicableLaws = ['RA 11313', 'RA 9262 (If victim is a woman/child)', 'ASH Code for Students'];
                        }
                        else if (normalizedData.relationshipType === 'authority') {
                            applicableLaws = ['RA 11313', 'RACCS', 'RA 7877', 'ASH Code for Employees'];
                        }
                        else if (normalizedData.relationshipType === 'stranger') {
                            applicableLaws = ['RA 11313', 'If UP student, ASH Code for Students', 'If UP employee, ASH Code for Employees'];
                        }
                        else {
                            applicableLaws = ['RA 11313'];
                        }
                    }
                    else if (normalizedData.complainedConstituent === 'No') {
                        if (normalizedData.relationshipType === 'classmate' || normalizedData.relationshipType === 'orgmate') {
                            applicableLaws = ['RA 11313', 'Contact details of SSO'];
                        }
                        else if (normalizedData.relationshipType === 'student_to_faculty') {
                            applicableLaws = ['RA 11313', 'RACCS', 'RA 7877', 'Contact details of SSO'];
                        }
                        else if (normalizedData.relationshipType === 'intimate') {
                            applicableLaws = ['RA 11313', 'RA 9262 (If victim is a woman/child)', 'Contact details of SSO'];
                        }
                        else if (normalizedData.relationshipType === 'authority') {
                            applicableLaws = ['RA 11313', 'RACCS', 'RA 7877', 'Contact details of SSO'];
                        }
                        else if (normalizedData.relationshipType === 'stranger') {
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
            if (normalizedData.victimConstituent === 'Yes' || normalizedData.victimConstituent === 'No') {
                const validPerpClasses = [
                    'Co-worker', 'Colleague', "Gov't Employee", 'Student', 'Stranger'
                ];
                if (validPerpClasses.includes(normalizedData.complainedClassification)) {
                    if (normalizedData.complainedConstituent === 'Yes') {
                        if (normalizedData.relationshipType === 'faculty_to_student') {
                            applicableLaws = ['RA 11313', 'RACCS', 'RA 7877', 'ASH Code for Students'];
                        }
                        else if (normalizedData.relationshipType === 'same-level') {
                            applicableLaws = ['RA 11313', 'RACCS', 'ASH Code for Employees'];
                        }
                        else if (normalizedData.relationshipType === 'staff_to_supervisor') {
                            applicableLaws = ['RA 11313', 'RACCS', 'RA 7877', 'ASH Code for Employees'];
                        }
                        else if (normalizedData.relationshipType === 'authority') {
                            applicableLaws = ['RA 11313', 'RACCS', 'RA 7877', 'ASH Code for Employees'];
                        }
                        else if (normalizedData.relationshipType === 'intimate') {
                            applicableLaws = ['RA 11313', 'RA 9262 (If victim is a woman/child)', 'RACCS', 'ASH Code for Employees'];
                        }
                        else if (normalizedData.relationshipType === 'none') {
                            applicableLaws = ['RA 11313', 'ASH Code for Students'];
                        }
                        else if (normalizedData.relationshipType === 'stranger') {
                            applicableLaws = ['RA 11313', 'If UP student, ASH Code for Students', 'If UP employee, ASH Code for Employees'];
                        }
                        else {
                            applicableLaws = ['RA 11313'];
                        }
                    }
                    else if (normalizedData.complainedConstituent === 'No') {
                        if (normalizedData.relationshipType === 'faculty_to_student') {
                            applicableLaws = ['RA 11313', 'RACCS', 'RA 7877', 'Contact details of SSO'];
                        }
                        else if (normalizedData.relationshipType === 'same-level') {
                            applicableLaws = ['RA 11313', 'RACCS', 'Contact details of SSO'];
                        }
                        else if (normalizedData.relationshipType === 'staff_to_supervisor') {
                            applicableLaws = ['RA 11313', 'RACCS', 'RA 7877', 'Contact details of SSO'];
                        }
                        else if (normalizedData.relationshipType === 'authority') {
                            applicableLaws = ['RA 11313', 'RACCS', 'RA 7877', 'Contact details of SSO'];
                        }
                        else if (normalizedData.relationshipType === 'intimate') {
                            applicableLaws = ['RA 11313', 'RA 9262 (If victim is a woman/child)', 'RACCS', 'Contact details of SSO'];
                        }
                        else if (normalizedData.relationshipType === 'none') {
                            applicableLaws = ['RA 11313', 'Contact details of SSO'];
                        }
                        else if (normalizedData.relationshipType === 'stranger') {
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
            
            const relationshipSection = document.getElementById('relationshipType')?.closest('.grid');
            if (relationshipSection && relationshipSection.parentNode) {
                relationshipSection.parentNode.insertBefore(lawsContainer, relationshipSection.nextSibling);
            }
        }
        
        if (applicableLaws.length > 0 && applicableLaws[0] !== 'Invalid complained classification') {
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