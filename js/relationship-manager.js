// relationship-manager.js
(function() {
    'use strict';

    // Static relationship options – display text capitalized
    const RELATIONSHIP_OPTIONS = [
        { value: "student", text: "Student" },
        { value: "professor", text: "Professor" },
        { value: "colleague", text: "Colleague" },
        { value: "classmate", text: "Classmate" },
        { value: "orgmate", text: "Orgmate" },
        { value: "friend", text: "Friend" },
        { value: "outsider/stranger", text: "Outsider/Stranger" },
        { value: "with moral ascendancy", text: "With Moral Ascendancy" },
        { value: "with intimate", text: "With Intimate" }
    ];

    // Static classification options (for both complainant and respondent) – display text capitalized
    const CLASSIFICATION_OPTIONS = [
        { value: "Student", text: "Student" },
        { value: "instructor/professor", text: "Instructor/Professor" },
        { value: "non-teaching personnel (admin & reps)", text: "Non-Teaching Personnel (Admin & Reps)" },
        { value: "Alumni", text: "Alumni" },
        { value: "non-UP/outsider", text: "Non-UP/Outsider" }
    ];

    // Cache DOM elements
    let victimSelect = null;      // complainant classification
    let relationshipSelect = null;
    let perpSelect = null;        // respondent classification

    // Populate complainant classification dropdown
    function updateComplainantOptions() {
        if (!victimSelect) return;
        victimSelect.innerHTML = '';
        const placeholder = document.createElement('option');
        placeholder.value = "";
        placeholder.textContent = "— Select category —";
        placeholder.disabled = true;
        placeholder.selected = true;
        victimSelect.appendChild(placeholder);
        
        CLASSIFICATION_OPTIONS.forEach(opt => {
            const option = document.createElement('option');
            option.value = opt.value;
            option.textContent = opt.text;
            victimSelect.appendChild(option);
        });
    }

    // Populate relationship dropdown
    function updateRelationshipOptions() {
        if (!relationshipSelect) return;
        relationshipSelect.innerHTML = '';
        const placeholder = document.createElement('option');
        placeholder.value = "";
        placeholder.textContent = "— Select relationship —";
        placeholder.disabled = true;
        placeholder.selected = true;
        relationshipSelect.appendChild(placeholder);
        
        RELATIONSHIP_OPTIONS.forEach(opt => {
            const option = document.createElement('option');
            option.value = opt.value;
            option.textContent = opt.text;
            relationshipSelect.appendChild(option);
        });
        
        const event = new CustomEvent('relationshipOptionsUpdated', { 
            detail: { optionsCount: RELATIONSHIP_OPTIONS.length }
        });
        document.dispatchEvent(event);
    }

    // Populate respondent classification dropdown
    function updateRespondentOptions() {
        if (!perpSelect) return;
        perpSelect.innerHTML = '';
        const placeholder = document.createElement('option');
        placeholder.value = "";
        placeholder.textContent = "— Select category —";
        placeholder.disabled = true;
        placeholder.selected = true;
        perpSelect.appendChild(placeholder);
        
        CLASSIFICATION_OPTIONS.forEach(opt => {
            const option = document.createElement('option');
            option.value = opt.value;
            option.textContent = opt.text;
            perpSelect.appendChild(option);
        });
        
        const event = new CustomEvent('respondentOptionsUpdated', { 
            detail: { optionsCount: CLASSIFICATION_OPTIONS.length }
        });
        document.dispatchEvent(event);
    }

    function resetComplainantDropdown() {
        if (!victimSelect) return;
        victimSelect.innerHTML = '';
        const placeholder = document.createElement('option');
        placeholder.value = "";
        placeholder.textContent = "— Select category —";
        placeholder.disabled = true;
        placeholder.selected = true;
        victimSelect.appendChild(placeholder);
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

    function resetRespondentDropdown() {
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
        
        // Initialize all dropdowns with capitalized options
        resetComplainantDropdown();
        updateComplainantOptions();
        resetRelationshipDropdown();
        updateRelationshipOptions();
        resetRespondentDropdown();
        updateRespondentOptions();
        
        // Listen for changes on complainant classification (if needed)
        victimSelect.addEventListener('change', function() {
            const event = new CustomEvent('victimClassChanged', { detail: { value: victimSelect.value } });
            document.dispatchEvent(event);
        });
        
        console.log('Relationship Manager initialized with capitalized options');
    }

    window.RelationshipManager = {
        init: init,
        getCurrentRelationship: getCurrentRelationship,
        getCurrentVictimClass: getCurrentVictimClass,
        getCurrentComplainedClass: getCurrentComplainedClass,
        resetDropdowns: function() {
            resetComplainantDropdown();
            updateComplainantOptions();
            resetRelationshipDropdown();
            updateRelationshipOptions();
            resetRespondentDropdown();
            updateRespondentOptions();
        },
        updateOptions: function() {
            updateComplainantOptions();
            updateRelationshipOptions();
            updateRespondentOptions();
        }
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();