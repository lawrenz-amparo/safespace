// relationship-manager.js
(function() {
    'use strict';

    // Relationship options for Student victims
    const STUDENT_OPTIONS = [
        { value: "classmate", text: "Classmate" },
        { value: "orgmate", text: "Organization Mate" },
        { value: "student_to_faculty", text: "Student to faculty/staff" },
        { value: "stranger", text: "Stranger" },
        { value: "intimate", text: "Within intimate, dating, marital, family relationship, or former intimate relationship" },
        { value: "authority", text: "With authority, influence, or moral ascendancy over victim" }
    ];

    // Relationship options for Non-Student victims (faculty, staff, etc.)
    const NON_STUDENT_OPTIONS = [
        { value: "same-level", text: "Same level / Colleague" },
        { value: "staff_to_supervisor", text: "Staff to immediate supervisor/boss" },
        { value: "faculty_to_student", text: "Faculty/Staff to Student" },   // NEW
        { value: "authority", text: "With authority, influence, or moral ascendancy over victim" },
        { value: "intimate", text: "Within intimate, dating, marital, family relationship, or former intimate relationship" },
        { value: "none", text: "No specific relationship" },
        { value: "stranger", text: "Stranger" }
    ];

    // Complained classification options based on victim type
    const COMPLAINED_OPTIONS = {
        student: [
            { value: "Student", text: "Student" },
            { value: "Professor", text: "Professor" },
            { value: "Instructor", text: "Instructor" },
            { value: "Teacher", text: "Teacher" },
            { value: "Gov't Employee", text: "Gov't Employee" },
            { value: "Stranger", text: "Stranger" }
        ],
        nonStudent: [
            { value: "Co-worker", text: "Co-worker" },
            { value: "Colleague", text: "Colleague" },
            { value: "Gov't Employee", text: "Gov't Employee" },
            { value: "Student", text: "Student" },
            { value: "Stranger", text: "Stranger" }
        ]
    };

    // Cache DOM elements
    let victimSelect = null;
    let relationshipSelect = null;
    let perpSelect = null;

    /**
     * Update relationship dropdown options based on victim classification
     */
    function updateRelationshipOptions() {
        if (!victimSelect || !relationshipSelect) return;

        const selectedVictim = victimSelect.value;
        
        relationshipSelect.innerHTML = '';
        
        let optionsToUse = [];
        
        if (selectedVictim === 'Student') {
            optionsToUse = STUDENT_OPTIONS;
        } else if (selectedVictim && selectedVictim !== '') {
            optionsToUse = NON_STUDENT_OPTIONS;
        } else {
            const placeholder = document.createElement('option');
            placeholder.value = "";
            placeholder.textContent = "— Select relationship —";
            placeholder.disabled = true;
            placeholder.selected = true;
            relationshipSelect.appendChild(placeholder);
            return;
        }
        
        const placeholderOpt = document.createElement('option');
        placeholderOpt.value = "";
        placeholderOpt.textContent = "— Select relationship —";
        placeholderOpt.disabled = true;
        placeholderOpt.selected = true;
        relationshipSelect.appendChild(placeholderOpt);
        
        optionsToUse.forEach(opt => {
            const option = document.createElement('option');
            option.value = opt.value;
            option.textContent = opt.text;
            relationshipSelect.appendChild(option);
        });
        
        const event = new CustomEvent('relationshipOptionsUpdated', { 
            detail: { victimType: selectedVictim, optionsCount: optionsToUse.length }
        });
        document.dispatchEvent(event);
    }

    /**
     * Update complained classification dropdown based on victim classification
     */
    function updateComplainedOptions() {
        if (!victimSelect || !perpSelect) return;

        const selectedVictim = victimSelect.value;
        
        perpSelect.innerHTML = '';
        
        let optionsToUse = [];
        
        if (selectedVictim === 'Student') {
            optionsToUse = COMPLAINED_OPTIONS.student;
        } else if (selectedVictim && selectedVictim !== '') {
            optionsToUse = COMPLAINED_OPTIONS.nonStudent;
        } else {
            const placeholder = document.createElement('option');
            placeholder.value = "";
            placeholder.textContent = "— Select category —";
            placeholder.disabled = true;
            placeholder.selected = true;
            perpSelect.appendChild(placeholder);
            return;
        }
        
        const placeholderOpt = document.createElement('option');
        placeholderOpt.value = "";
        placeholderOpt.textContent = "— Select category —";
        placeholderOpt.disabled = true;
        placeholderOpt.selected = true;
        perpSelect.appendChild(placeholderOpt);
        
        optionsToUse.forEach(opt => {
            const option = document.createElement('option');
            option.value = opt.value;
            option.textContent = opt.text;
            perpSelect.appendChild(option);
        });
        
        const event = new CustomEvent('complainedOptionsUpdated', { 
            detail: { victimType: selectedVictim, optionsCount: optionsToUse.length }
        });
        document.dispatchEvent(event);
    }

    function resetRelationshipDropdown() {
        if (!relationshipSelect) return;
        relationshipSelect.innerHTML = '';
        const placeholder = document.createElement('option');
        placeholder.value = "";
        placeholder.textContent = "— Select relationship —";
        placeholder.disabled = true;
        placeholder.selected = true;
        relationshipSelect.appendChild(placeholder);
    }

    function resetComplainedDropdown() {
        if (!perpSelect) return;
        perpSelect.innerHTML = '';
        const placeholder = document.createElement('option');
        placeholder.value = "";
        placeholder.textContent = "— Select category —";
        placeholder.disabled = true;
        placeholder.selected = true;
        perpSelect.appendChild(placeholder);
    }

    function getCurrentRelationship() {
        return relationshipSelect ? relationshipSelect.value : '';
    }

    function getCurrentVictimClass() {
        return victimSelect ? victimSelect.value : '';
    }

    function getCurrentComplainedClass() {
        return perpSelect ? perpSelect.value : '';
    }

    function init() {
        victimSelect = document.getElementById('victimClass');
        relationshipSelect = document.getElementById('relationship');
        perpSelect = document.getElementById('perpClass');
        
        if (!victimSelect || !relationshipSelect || !perpSelect) {
            console.warn('Relationship Manager: Required elements not found');
            return;
        }
        
        resetRelationshipDropdown();
        resetComplainedDropdown();
        
        victimSelect.addEventListener('change', function() {
            updateRelationshipOptions();
            updateComplainedOptions();
        });
        
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.type === 'attributes' && mutation.attributeName === 'value') {
                    updateRelationshipOptions();
                    updateComplainedOptions();
                }
            });
        });
        observer.observe(victimSelect, { attributes: true });
        
        console.log('Relationship Manager initialized');
    }

    window.RelationshipManager = {
        init: init,
        getCurrentRelationship: getCurrentRelationship,
        getCurrentVictimClass: getCurrentVictimClass,
        getCurrentComplainedClass: getCurrentComplainedClass,
        resetDropdowns: function() {
            resetRelationshipDropdown();
            resetComplainedDropdown();
        },
        updateOptions: function() {
            updateRelationshipOptions();
            updateComplainedOptions();
        }
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();