// relationship-manager.js
(function() {
    'use strict';

    // Static relationship options (same for all complainants)
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

    // Static respondent classification options (same for all complainants)
    const RESPONDENT_OPTIONS = [
        { value: "Student", text: "Student" },
        { value: "instructor/professor", text: "instructor/professor" },
        { value: "non-teaching personnel (admin & reps)", text: "non-teaching personnel (admin & reps)" },
        { value: "Alumni", text: "Alumni" },
        { value: "non-UP/outsider", text: "non-UP/outsider" }
    ];

    // Cache DOM elements
    let victimSelect = null;      // complainant classification
    let relationshipSelect = null;
    let perpSelect = null;        // respondent classification

    /**
     * Populate relationship dropdown with static options
     */
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

    /**
     * Populate respondent classification dropdown with static options
     */
    function updateRespondentOptions() {
        if (!perpSelect) return;
        perpSelect.innerHTML = '';
        const placeholder = document.createElement('option');
        placeholder.value = "";
        placeholder.textContent = "— Select category —";
        placeholder.disabled = true;
        placeholder.selected = true;
        perpSelect.appendChild(placeholder);
        
        RESPONDENT_OPTIONS.forEach(opt => {
            const option = document.createElement('option');
            option.value = opt.value;
            option.textContent = opt.text;
            perpSelect.appendChild(option);
        });
        
        const event = new CustomEvent('respondentOptionsUpdated', { 
            detail: { optionsCount: RESPONDENT_OPTIONS.length }
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
        
        // Initialize dropdowns with static options
        resetRelationshipDropdown();
        updateRelationshipOptions();
        resetRespondentDropdown();
        updateRespondentOptions();
        
        // No need to listen for victimSelect changes because options are static,
        // but we keep a change listener to notify other components if needed.
        victimSelect.addEventListener('change', function() {
            const event = new CustomEvent('victimClassChanged', { detail: { value: victimSelect.value } });
            document.dispatchEvent(event);
        });
        
        console.log('Relationship Manager initialized with static options');
    }

    window.RelationshipManager = {
        init: init,
        getCurrentRelationship: getCurrentRelationship,
        getCurrentVictimClass: getCurrentVictimClass,
        getCurrentComplainedClass: getCurrentComplainedClass,
        resetDropdowns: function() {
            resetRelationshipDropdown();
            updateRelationshipOptions();
            resetRespondentDropdown();
            updateRespondentOptions();
        },
        updateOptions: function() {
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