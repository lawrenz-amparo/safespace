// law-mapper.js – NO FILTERING: ALL policies under each mapped law
(function() {
    'use strict';

    // ---------- Office Details ----------
    const officeDetails = {
        'OASH': {
            name: 'Office for Anti-Sexual Harassment (OASH)',
            address: '2nd Floor IH Bldg. Jos B. Juliano Ave. Brgy. Batong Malake, Los Baños, Philippines, 4031',
            phone: '0991 896 9602',
            email: 'oash.uplb@up.edu.ph'
        },
        'SSO': {
            name: 'Security and Safety Office (SSO)',
            address: 'Andres P. Aglibut Ave. University of the Philippines Los Baños, College, Los Baños, Laguna, 4031, Philippines',
            phone: 'Hotline: (049) 536 2243<br>Office: (049) 536 2803<br>Globe: 0975 928 7880<br>Smart: 0921 890 1259',
            email: 'sso.uplb@up.edu.ph'
        },
        'SDT': {
            name: 'Student Disciplinary Tribunal (SDT)',
            address: 'Room 2, 2/F, Student Union Building, UPLB, Laguna, 4031, Philippines',
            phone: '+63 999 221 1484',
            email: 'sdt.uplb@up.edu.ph'
        },
        'HRDO': {
            name: 'Human Resources Development Office (HRDO)',
            address: '1/F Abelardo G. Samonte Hall University of the Philippines Los Baños, College, Batong Malake, Los Baños, Laguna, Philippines 4031',
            phone: '+63 998 571 8619 / +63 998 57 51071',
            email: 'hrdo.uplb@up.edu.ph'
        },
        'External': {
            name: 'External Agency',
            address: 'Contact the Philippine National Police (PNP) or the Commission on Human Rights (CHR)',
            phone: 'PNP: 911 or local police station',
            email: ''
        }
    };

    // ---------- Helper: Map frontend values to table categories ----------
    function mapVictimType(victimClassification) {
        if (victimClassification === 'Student') return 'Student';
        if (['instructor/professor', 'non-teaching personnel (admin & reps)', 'Gov\'t Employee', 'Professor', 'Instructor', 'Teacher'].includes(victimClassification)) {
            return 'Employee';
        }
        return 'Other';
    }

    function mapPerpetratorType(perpClassification) {
        const perp = perpClassification;
        if (perp === 'Student') return 'Student';
        if (['instructor/professor', 'Professor', 'Instructor', 'Teacher'].includes(perp)) return 'Professor/Instructor/Teacher';
        if (['non-teaching personnel (admin & reps)', 'Gov\'t Employee', 'Co-worker', 'Colleague'].includes(perp)) return 'Gov\'t Employee';
        if (perp === 'Alumni' || perp === 'non-UP/outsider') return 'Stranger';
        return 'Stranger';
    }

    function mapRelationship(relationshipType) {
        const rel = relationshipType;
        if (['classmate', 'orgmate', 'friend', 'outsider/stranger', 'student'].includes(rel)) return 'classmate/orgmate/stranger';
        if (rel === 'with intimate') return 'intimate';
        if (rel === 'with moral ascendancy' || rel === 'professor') return 'authority';
        if (rel === 'colleague') return 'same level';
        return 'none';
    }

    // ---------- Determine action (unchanged) ----------
    function determineAction(data) {
        const { complainedConstituent, complainedClassification, incidentLocation } = data;
        const isPerpUP = complainedConstituent === 'Yes';
        const isPerpStudent = complainedClassification === 'Student';
        const isPerpEmployee = ['Professor', 'Instructor', 'Teacher', "Gov't Employee", 'instructor/professor', 'non-teaching personnel (admin & reps)'].includes(complainedClassification);

        if (!isPerpUP) {
            return {
                office: 'SSO',
                action: 'Since the perpetrator is not a constituent of UPLB, you may report this incident to the Security and Safety Office (SSO).'
            };
        }
        switch (incidentLocation) {
            case 'inside_campus':
            case 'outside_uplb_activity':
                return { office: 'OASH', action: 'Report this incident to the Office for Anti-Sexual Harassment (OASH).' };
            case 'outside_not_uplb':
                if (isPerpStudent) {
                    return { office: 'SDT', action: 'Since the incident happened outside the university and the perpetrator is a UPLB student, you may report to the Student Disciplinary Tribunal (SDT).' };
                } else if (isPerpEmployee) {
                    return { office: 'HRDO', action: 'Since the incident happened outside the university and the perpetrator is a UPLB employee, you may report to the Human Resources Development Office (HRDO).' };
                } else {
                    return { office: 'OASH', action: 'Report this incident to the Office for Anti-Sexual Harassment (OASH) for guidance.' };
                }
            default:
                return { office: 'OASH', action: 'Contact the Office for Anti-Sexual Harassment (OASH) for guidance.' };
        }
    }

    // ---------- Determine applicable laws (decision table, unchanged) ----------
    function determineApplicableLaws(data, aiResult) {
        const {
            victimClassification,
            complainedClassification,
            relationshipType,
            victimConstituent,
            complainedConstituent
        } = data;

        const victimCat = mapVictimType(victimClassification);
        const perpCat = mapPerpetratorType(complainedClassification);
        const relCat = mapRelationship(relationshipType);
        const victimUP = victimConstituent === 'Yes';
        const perpUP = complainedConstituent === 'Yes';

        let applicableLaws = [];

        function addLaw(law) {
            if (!applicableLaws.includes(law)) applicableLaws.push(law);
        }

        // Decision logic (your table)
        if (victimCat === 'Student') {
            if (victimUP) {
                if (perpCat === 'Student' && perpUP) {
                    if (relCat === 'classmate/orgmate/stranger') {
                        applicableLaws = ['RA 11313', 'ASH Code for Students'];
                    } else if (relCat === 'intimate') {
                        applicableLaws = ['RA 11313', 'RA 9262 (If victim is a woman/child)', 'ASH Code for Students'];
                    } else {
                        applicableLaws = ['RA 11313', 'ASH Code for Students'];
                    }
                } else if (perpCat === 'Professor/Instructor/Teacher' && perpUP && relCat === 'authority') {
                    applicableLaws = ['RA 11313', 'RACCS', 'RA 7877', 'ASH Code for Employees'];
                } else if (perpCat === 'Stranger' && perpUP && relCat === 'classmate/orgmate/stranger') {
                    applicableLaws = ['RA 11313'];
                    if (victimCat === 'Student') addLaw('ASH Code for Students');
                    else if (victimCat === 'Employee') addLaw('ASH Code for Employees');
                } else if (perpCat === 'Student' && !perpUP) {
                    if (relCat === 'classmate/orgmate/stranger') {
                        applicableLaws = ['RA 11313', 'Contact details of SSO'];
                    } else if (relCat === 'intimate') {
                        applicableLaws = ['RA 11313', 'RA 9262 (If victim is a woman/child)', 'Contact details of SSO'];
                    } else {
                        applicableLaws = ['RA 11313', 'Contact details of SSO'];
                    }
                } else if (perpCat === 'Professor/Instructor/Teacher' && !perpUP && relCat === 'authority') {
                    applicableLaws = ['RA 11313', 'RACCS', 'RA 7877', 'Contact details of SSO'];
                } else if (perpCat === 'Stranger' && !perpUP && relCat === 'classmate/orgmate/stranger') {
                    applicableLaws = ['RA 11313', 'Contact details of SSO'];
                } else {
                    applicableLaws = ['RA 11313'];
                }
            } else {
                // Victim UP = No
                if (perpCat === 'Student' && perpUP) {
                    if (relCat === 'none' || relCat === 'classmate/orgmate/stranger') {
                        applicableLaws = ['RA 11313', 'ASH Code for Students'];
                    } else if (relCat === 'intimate') {
                        applicableLaws = ['RA 11313', 'RA 9262 (If victim is a woman/child)', 'ASH Code for Students'];
                    } else {
                        applicableLaws = ['RA 11313', 'ASH Code for Students'];
                    }
                } else if (perpCat === 'Professor/Instructor/Teacher' && perpUP && relCat === 'authority') {
                    applicableLaws = ['RA 11313', 'RACCS', 'RA 7877', 'ASH Code for Employees'];
                } else if (perpCat === 'Stranger' && perpUP && relCat === 'classmate/orgmate/stranger') {
                    applicableLaws = ['RA 11313'];
                    if (victimCat === 'Student') addLaw('ASH Code for Students');
                    else if (victimCat === 'Employee') addLaw('ASH Code for Employees');
                } else {
                    applicableLaws = ['RA 11313'];
                }
            }
        } else if (victimCat === 'Employee') {
            if (victimUP) {
                if (perpCat === 'Gov\'t Employee' && perpUP) {
                    if (relCat === 'same level') {
                        applicableLaws = ['RA 11313', 'RACCS', 'ASH Code for Employees'];
                    } else if (relCat === 'authority') {
                        applicableLaws = ['RA 11313', 'RACCS', 'RA 7877', 'ASH Code for Employees'];
                    } else if (relCat === 'intimate') {
                        applicableLaws = ['RA 11313', 'RA 9262 (If victim is a woman/child)', 'RACCS', 'ASH Code for Employees'];
                    } else {
                        applicableLaws = ['RA 11313', 'RACCS', 'ASH Code for Employees'];
                    }
                } else if (perpCat === 'Student' && perpUP) {
                    applicableLaws = ['RA 11313', 'ASH Code for Students'];
                } else if (perpCat === 'Stranger' && perpUP) {
                    applicableLaws = ['RA 11313'];
                    if (victimCat === 'Student') addLaw('ASH Code for Students');
                    else if (victimCat === 'Employee') addLaw('ASH Code for Employees');
                } else if (perpCat === 'Gov\'t Employee' && !perpUP) {
                    if (relCat === 'same level') {
                        applicableLaws = ['RA 11313', 'RACCS', 'Contact details of SSO'];
                    } else if (relCat === 'authority') {
                        applicableLaws = ['RA 11313', 'RACCS', 'RA 7877', 'Contact details of SSO'];
                    } else if (relCat === 'intimate') {
                        applicableLaws = ['RA 11313', 'RA 9262 (If victim is a woman/child)', 'RACCS', 'Contact details of SSO'];
                    } else {
                        applicableLaws = ['RA 11313', 'RACCS', 'Contact details of SSO'];
                    }
                } else if (perpCat === 'Student' && !perpUP) {
                    applicableLaws = ['RA 11313', 'Contact details of SSO'];
                } else if (perpCat === 'Stranger' && !perpUP) {
                    applicableLaws = ['RA 11313', 'Contact details of SSO'];
                } else {
                    applicableLaws = ['RA 11313'];
                }
            } else {
                // Victim UP = No
                if (perpCat === 'Gov\'t Employee' && perpUP) {
                    if (relCat === 'same level' || relCat === 'authority') {
                        applicableLaws = ['RA 11313', 'RACCS', 'ASH Code for Employees'];
                    } else if (relCat === 'intimate') {
                        applicableLaws = ['RA 11313', 'RA 9262 (If victim is a woman/child)', 'RACCS', 'ASH Code for Employees'];
                    } else {
                        applicableLaws = ['RA 11313', 'RACCS', 'ASH Code for Employees'];
                    }
                } else if (perpCat === 'Student' && perpUP) {
                    applicableLaws = ['RA 11313', 'ASH Code for Students'];
                } else if (perpCat === 'Stranger' && perpUP) {
                    applicableLaws = ['RA 11313'];
                    if (victimCat === 'Student') addLaw('ASH Code for Students');
                    else if (victimCat === 'Employee') addLaw('ASH Code for Employees');
                } else {
                    applicableLaws = ['RA 11313'];
                }
            }
        } else {
            applicableLaws = ['RA 11313'];
        }

        // AI result additional laws (only add if not Not Sexual Harassment)
        if (aiResult && aiResult.category && aiResult.category !== 'Not Sexual Harassment') {
            const cat = aiResult.category;
            if (cat === 'Cyber') addLaw('RA 9995 (Anti-Photo and Video Voyeurism Act) - if applicable');
            if (cat === 'Physical') {
                const isIntimate = relCat === 'intimate';
                const isStudentVictim = victimCat === 'Student';
                const isEmployeePerp = perpCat === 'Professor/Instructor/Teacher' || perpCat === 'Gov\'t Employee';
                if (isIntimate && (isStudentVictim || isEmployeePerp)) {
                    addLaw('RA 9262 (VAWC) - If victim is a woman/child');
                }
            }
        }

        applicableLaws = [...new Set(applicableLaws)];
        const actualLaws = applicableLaws.filter(law => !law.includes('Contact details of SSO'));
        const externalAssistance = applicableLaws.filter(law => law.includes('Contact details of SSO'));
        const actionInfo = determineAction(data);

        return { applicableLaws: actualLaws, externalAssistance, recommendedAction: actionInfo };
    }

    // ---------- Get policies for laws – NO FILTERING, returns entire arrays ----------
    function getPoliciesForLaws(lawNames) {
        let allPolicies = [];

        lawNames.forEach(lawName => {
            let policyArray = null;
            if (lawName.includes('RA 11313') || lawName.includes('Safe Spaces Act')) {
                policyArray = irrRA11313;
            } else if (lawName.includes('RA 7877') || lawName.includes('Anti-Sexual Harassment Act')) {
                policyArray = ra7877;
            } else if (lawName.includes('RA 9262') || lawName.includes('VAWC')) {
                policyArray = ra9262;
            } else if (lawName.includes('RACCS')) {
                policyArray = raccs;
            } else if (lawName.includes('ASH Code for Students') || lawName.includes('ASH Code for Employees')) {
                policyArray = antiSexualHarassmentCode;
            }
            if (policyArray) {
                allPolicies.push(...policyArray.map(p => ({ ...p, law_display_name: lawName })));
            }
        });

        // Remove duplicates by policy_id (in case same policy appears from different law names)
        const unique = [];
        const seen = new Set();
        for (const policy of allPolicies) {
            if (!seen.has(policy.policy_id)) {
                seen.add(policy.policy_id);
                unique.push(policy);
            }
        }
        return unique;
    }

    // ---------- Display applicable laws (hides everything for Not Sexual Harassment) ----------
    function displayApplicableLaws(applicableLaws, externalAssistance, recommendedAction, aiResult) {
        const lawsContainer = document.getElementById('applicableLawsContainer');
        const recommendedContainer = document.getElementById('recommendedActionContainer');
        const recommendedText = document.getElementById('recommendedActionText');

        // If Not Sexual Harassment, hide everything and return
        if (aiResult && aiResult.category === 'Not Sexual Harassment') {
            if (lawsContainer) lawsContainer.style.display = 'none';
            if (recommendedContainer) recommendedContainer.style.display = 'none';
            return;
        }

        // Show recommended action container
        if (recommendedContainer && recommendedText && recommendedAction) {
            recommendedContainer.style.display = 'block';
            const officeCode = recommendedAction.office;
            const details = officeDetails[officeCode] || officeDetails['External'];
            let detailsHtml = `
                <div class="space-y-3">
                    <p class="text-sm font-medium text-blue-800">${recommendedAction.action}</p>
                    <div class="bg-white rounded-lg p-3 border border-blue-100">
                        <div class="flex items-start gap-2 mb-2">
                            <i class="fas fa-building text-blue-600 mt-0.5"></i>
                            <div class="text-xs">
                                <span class="font-semibold">${details.name}</span><br>
                                <span class="text-gray-600">${details.address}</span>
                            </div>
                        </div>
                        <div class="flex items-start gap-2 mb-2">
                            <i class="fas fa-phone text-blue-600 mt-0.5"></i>
                            <div class="text-xs">${details.phone}</div>
                        </div>
                        ${details.email ? `
                        <div class="flex items-start gap-2">
                            <i class="fas fa-envelope text-blue-600 mt-0.5"></i>
                            <div class="text-xs">${details.email}</div>
                        </div>` : ''}
                    </div>
                </div>
            `;
            recommendedText.innerHTML = detailsHtml;
        } else if (recommendedContainer) {
            recommendedContainer.style.display = 'none';
        }

        if (!lawsContainer) return;

        if (!applicableLaws || applicableLaws.length === 0) {
            lawsContainer.innerHTML = `
                <div class="flex items-start gap-3">
                    <i class="fas fa-exclamation-triangle text-amber-600 text-xl mt-1"></i>
                    <div class="flex-1">
                        <h4 class="font-semibold text-amber-800 mb-2">⚠️ No applicable laws</h4>
                        <p class="text-sm text-amber-700">Based on the provided context, no specific laws apply.</p>
                    </div>
                </div>
            `;
            lawsContainer.style.display = 'block';
            return;
        }

        // Get ALL policies (no filtering)
        let policyDetails = getPoliciesForLaws(applicableLaws);

        const grouped = {};
        policyDetails.forEach(p => {
            const law = p.law_display_name;
            if (!grouped[law]) grouped[law] = [];
            grouped[law].push(p);
        });
        const lawNames = Object.keys(grouped);

        if (lawNames.length === 0) {
            lawsContainer.innerHTML = `
                <div class="flex items-start gap-3">
                    <i class="fas fa-info-circle text-blue-600 text-xl mt-1"></i>
                    <div class="flex-1">
                        <h4 class="font-semibold text-up-dark mb-3">Applicable Laws</h4>
                        <ul class="list-disc pl-5 space-y-1">
                            ${applicableLaws.map(law => `<li>${escapeHtml(law)}</li>`).join('')}
                        </ul>
                        <p class="text-sm text-gray-600 mt-3">No specific policy details found for these laws.</p>
                    </div>
                </div>
            `;
            lawsContainer.style.display = 'block';
            return;
        }

        let tabsHtml = `
            <div class="flex items-start gap-3">
                <i class="fas fa-gavel text-up text-xl mt-1"></i>
                <div class="flex-1">
                    <h4 class="font-semibold text-up-dark mb-3">Applicable Laws & Policies</h4>
                    <div class="border-b border-gray-200 mb-4">
                        <ul class="flex flex-wrap -mb-px text-sm font-medium text-center" id="lawTabs" role="tablist">
        `;
        lawNames.forEach((law, idx) => {
            const isActive = idx === 0;
            const icon = getLawIcon(law);
            tabsHtml += `
                <li class="mr-2" role="presentation">
                    <button class="inline-block p-3 rounded-t-lg border-b-2 ${isActive ? 'border-up text-up' : 'border-transparent hover:text-gray-600 hover:border-gray-300 text-gray-500'}"
                            id="tab-${idx}" data-tab-target="tabpanel-${idx}" type="button" role="tab"
                            aria-controls="tabpanel-${idx}" aria-selected="${isActive}">
                        <i class="${icon} mr-2"></i>${law}
                        <span class="ml-1 text-xs bg-gray-100 px-2 py-0.5 rounded-full">${grouped[law].length}</span>
                    </button>
                </li>
            `;
        });
        tabsHtml += `</ul></div><div class="tab-content">`;

        lawNames.forEach((law, idx) => {
            const isActive = idx === 0;
            const policies = grouped[law];
            tabsHtml += `
                <div id="tabpanel-${idx}" role="tabpanel" aria-labelledby="tab-${idx}" class="${isActive ? '' : 'hidden'}">
                    <div class="space-y-3 max-h-[500px] overflow-y-auto pr-2">
            `;
            policies.forEach(p => {
                tabsHtml += `
                    <div class="bg-white rounded-lg border border-gray-200 hover:shadow-md transition-all duration-200 overflow-hidden">
                        <div class="bg-gray-50 px-4 py-2 border-b border-gray-200 flex justify-between items-center">
                            <h6 class="font-semibold text-gray-800 text-sm flex items-center gap-2">
                                <i class="fas fa-file-alt text-up text-xs"></i> ${escapeHtml(p.title)}
                            </h6>
                            <span class="text-xs text-up font-mono bg-up-muted px-2 py-1 rounded">${p.policy_id}</span>
                        </div>
                        <div class="p-4">
                            ${p.section ? `<div class="mb-2"><span class="text-xs font-semibold text-gray-500 uppercase">Section</span><p class="text-xs text-gray-700 mt-1">${escapeHtml(p.section)}</p></div>` : ''}
                            <div class="mb-2"><span class="text-xs font-semibold text-gray-500 uppercase">Content</span><p class="text-sm text-gray-700 mt-1 leading-relaxed">${escapeHtml(p.content)}</p></div>
                            ${p.punishment ? `<div class="mt-2 p-2 bg-red-50 rounded border-l-2 border-red-500"><span class="text-xs font-semibold text-red-700 uppercase flex items-center gap-1"><i class="fas fa-gavel"></i> Penalty</span><p class="text-xs text-red-600 mt-1">${escapeHtml(p.punishment)}</p></div>` : ''}
                            ${p.keywords && p.keywords.length ? `<div class="mt-2 flex flex-wrap gap-1">${p.keywords.slice(0,5).map(kw => `<span class="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">#${escapeHtml(kw)}</span>`).join('')}</div>` : ''}
                            ${p.applicable_to && p.applicable_to.length ? `<div class="mt-2 text-xs text-gray-400"><i class="fas fa-users mr-1"></i> Applies to: ${p.applicable_to.join(', ')}</div>` : ''}
                        </div>
                    </div>
                `;
            });
            tabsHtml += `</div></div>`;
        });
        tabsHtml += `
                    </div>
                    <div class="mt-4 pt-3 border-t border-amber-200 text-xs text-amber-700">
                        <i class="fas fa-info-circle mr-1"></i> Note: Laws are mapped based on the provided context. For formal legal advice, please consult the Office of the University Legal Counsel.
                    </div>
                </div>
            </div>
        `;
        lawsContainer.innerHTML = tabsHtml;
        lawsContainer.style.display = 'block';

        const tabs = document.querySelectorAll('[data-tab-target]');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const targetId = tab.getAttribute('data-tab-target');
                document.querySelectorAll('[role="tab"]').forEach(t => {
                    t.classList.remove('border-up', 'text-up');
                    t.classList.add('border-transparent', 'text-gray-500');
                    t.setAttribute('aria-selected', 'false');
                });
                tab.classList.add('border-up', 'text-up');
                tab.classList.remove('border-transparent', 'text-gray-500');
                tab.setAttribute('aria-selected', 'true');
                document.querySelectorAll('[role="tabpanel"]').forEach(panel => panel.classList.add('hidden'));
                const targetPanel = document.getElementById(targetId);
                if (targetPanel) targetPanel.classList.remove('hidden');
            });
        });
    }

    // ---------- Helper functions ----------
    function getLawIcon(lawName) {
        if (lawName.includes('Safe Spaces Act')) return 'fas fa-street-view';
        if (lawName.includes('RA 7877')) return 'fas fa-briefcase';
        if (lawName.includes('RA 9262') || lawName.includes('VAWC')) return 'fas fa-heart';
        if (lawName.includes('RACCS')) return 'fas fa-building';
        if (lawName.includes('ASH Code')) return 'fas fa-gavel';
        return 'fas fa-book';
    }

    function escapeHtml(str) {
        if (!str) return '';
        return str.replace(/[&<>]/g, m => m === '&' ? '&amp;' : (m === '<' ? '&lt;' : '&gt;'));
    }

    function exportPolicies() {
        const resultPanel = document.getElementById('resultPanel');
        if (!resultPanel || resultPanel.classList.contains('hidden')) return;
        const lawSections = document.querySelectorAll('[role="tabpanel"]');
        let exportText = 'UPLB OASH - Applicable Laws Report\n' + '='.repeat(50) + '\n' + `Generated: ${new Date().toLocaleString()}\n\n`;
        lawSections.forEach((section, index) => {
            const tabButton = document.querySelector(`[data-tab-target="tabpanel-${index}"]`);
            if (tabButton) {
                const lawName = tabButton.textContent.replace(/[0-9]/g, '').trim();
                exportText += `📚 ${lawName}\n` + '-'.repeat(40) + '\n';
                const policies = section.querySelectorAll('.bg-white.rounded-lg');
                policies.forEach(policy => {
                    const title = policy.querySelector('h6')?.textContent || '';
                    const content = policy.querySelector('.text-gray-700')?.textContent || '';
                    const penalty = policy.querySelector('.bg-red-50 .text-red-600')?.textContent || '';
                    exportText += `\n▪ ${title}\n  ${content.substring(0, 200)}${content.length > 200 ? '...' : ''}\n`;
                    if (penalty) exportText += `  Penalty: ${penalty}\n`;
                    exportText += '\n';
                });
                exportText += '\n';
            }
        });
        const blob = new Blob([exportText], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `uplb-oash-report-${Date.now()}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    function getFormData() {
        return {
            victimClassification: document.getElementById('victimClass')?.value || '',
            complainedClassification: document.getElementById('perpClass')?.value || '',
            victimConstituent: document.querySelector('input[name="victimUP"]:checked')?.value || '',
            complainedConstituent: document.querySelector('input[name="perpUP"]:checked')?.value || '',
            relationshipType: document.getElementById('relationship')?.value || '',
            incidentLocation: document.getElementById('incidentLocation')?.value || ''
        };
    }

    function analyzeAndDisplayLaws(aiResult) {
        const formData = getFormData();
        if (!formData.victimClassification || !formData.complainedClassification ||
            !formData.victimConstituent || !formData.complainedConstituent ||
            !formData.relationshipType || !formData.incidentLocation) {
            displayApplicableLaws(['Please complete all legal context fields'], [], null, aiResult);
            return;
        }
        const result = determineApplicableLaws(formData, aiResult);
        displayApplicableLaws(result.applicableLaws, result.externalAssistance, result.recommendedAction, aiResult);
        return result;
    }

    function mapLawsFromReport(report, aiResult) {
        const context = {
            victimClassification: report.victimClassification || report.classification || '',
            complainedClassification: report.complainedClassification || '',
            victimConstituent: report.victimConstituent || '',
            complainedConstituent: report.complainedConstituent || '',
            relationshipType: report.relationshipType || deriveRelationshipType(report),
            incidentLocation: report.incidentLocation || mapIncidentLocation(report)
        };
        const missing = [];
        if (!context.victimClassification) missing.push('victim classification');
        if (!context.complainedClassification) missing.push('perpetrator classification');
        if (!context.victimConstituent) missing.push('victim constituent status');
        if (!context.complainedConstituent) missing.push('perpetrator constituent status');
        if (!context.incidentLocation) missing.push('incident location');
        if (missing.length) {
            console.warn('mapLawsFromReport: missing fields', missing, report);
            displayApplicableLaws(['Incomplete report data'], [], null, aiResult);
            return null;
        }
        const result = determineApplicableLaws(context, aiResult);
        displayApplicableLaws(result.applicableLaws, result.externalAssistance, result.recommendedAction, aiResult);
        return result;
    }

    function deriveRelationshipType(report) {
        const victimClass = report.victimClassification || report.classification;
        const perpClass = report.complainedClassification;
        if (!victimClass || !perpClass) return 'unknown';
        if (victimClass === 'Student' && perpClass === 'Student') return 'same-level';
        if ((victimClass === 'Student' && isEmployee(perpClass)) || (isEmployee(victimClass) && perpClass === 'Student')) return 'authority';
        if (isEmployee(victimClass) && isEmployee(perpClass)) return 'same-level';
        return 'unknown';
    }

    function isEmployee(cls) {
        return ['Professor', 'Instructor', 'Teacher', "Gov't Employee"].includes(cls);
    }

    function mapIncidentLocation(report) {
        if (report.incidentLocation) return report.incidentLocation;
        if (report.complainedInsideCampus === 'Yes') return 'inside_campus';
        if (report.complainedInsideCampus === 'No') return 'outside_not_uplb';
        return '';
    }

    window.LawMapper = {
        determineApplicableLaws,
        displayApplicableLaws,
        getFormData,
        analyzeAndDisplayLaws,
        exportPolicies,
        mapLawsFromReport
    };
})();