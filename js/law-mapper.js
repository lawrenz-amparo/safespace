// law-mapper.js
(function() {
    'use strict';

    // ---------- Office Details ----------
    const officeDetails = {
        'OASH': {
            name: 'Office for Anti-Sexual Harassment (OASH)',
            address: 'Mezzanine, Graduate School Bldg., International House Complex, UPLB, Los Baños, Laguna',
            phone: '+63 49 501 1844',
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

    // ---------- Helper: Infer harassment type(s) from a policy ----------
    function inferHarassmentType(policy) {
        const types = [];
        const text = (policy.title + ' ' + (policy.content || '') + ' ' + (policy.keywords || []).join(' ')).toLowerCase();

        if (/(grop|touch|pinch|physical|body|private parts|sexual assault|force|torture|kissing)/.test(text)) types.push('Physical');
        if (/(catcall|remark|slur|verbal|sexist|homophobic|transphobic|misogynistic|joke|comment|request|demand)/.test(text)) types.push('Verbal');
        if (/(leer|ogling|gesture|flash|expos|image|picture|graffiti|stalking|brushing|lewd|obscene)/.test(text)) types.push('Non-Verbal');
        if (/(online|cyber|internet|digital|social media|email|message|dm|upload|share|post|telephone|cellular|fax)/.test(text)) types.push('Cyber');
        return types;
    }

    // ---------- Filter policies by AI result ----------
    function filterPoliciesByAI(policies, aiResult) {
        if (!aiResult) return policies;
        let filtered = policies;
        if (aiResult.severity) {
            const severityMap = {
                'Light': 'Light Offense',
                'Less Grave': 'Less Grave Offense',
                'Grave': 'Grave Offense'
            };
            const expected = severityMap[aiResult.severity];
            if (expected) filtered = filtered.filter(p => p.offense_category === expected);
        }
        if (aiResult.category && aiResult.category !== 'Not Harassment') {
            const aiCat = aiResult.category;
            filtered = filtered.filter(p => {
                const types = inferHarassmentType(p);
                return types.length === 0 || types.includes(aiCat);
            });
        }
        return filtered;
    }

    // ---------- Determine action ----------
    function determineAction(data) {
        const { complainedConstituent, complainedClassification, incidentLocation } = data;
        const isPerpUP = complainedConstituent === 'Yes';
        const isPerpStudent = complainedClassification === 'Student';
        const isPerpEmployee = ['Professor', 'Instructor', 'Teacher', "Gov't Employee"].includes(complainedClassification);

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

    // ---------- Determine applicable laws ----------
    function determineApplicableLaws(data, aiResult) {
        const { victimClassification, complainedClassification, relationshipType } = data;
        const isStudentVictim = victimClassification === 'Student';
        const isStudentPerp = complainedClassification === 'Student';
        const isEmployeePerp = ['Professor', 'Instructor', 'Teacher', "Gov't Employee"].includes(complainedClassification);
        const isIntimate = relationshipType === 'intimate';
        const isAuthority = relationshipType === 'authority' || relationshipType === 'student_to_faculty' || relationshipType === 'staff_to_supervisor';
        const isSameLevel = relationshipType === 'same-level';

        let applicableLaws = ['RA 11313 (Safe Spaces Act)'];

        if (aiResult && aiResult.category && aiResult.category !== 'Not Harassment') {
            const cat = aiResult.category;
            if (cat === 'Cyber') applicableLaws.push('RA 9995 (Anti-Photo and Video Voyeurism Act) - if applicable');
            if (cat === 'Physical' && isIntimate && (isStudentVictim || isEmployeePerp)) applicableLaws.push('RA 9262 (VAWC) - If victim is a woman/child');
        }

        if (isStudentVictim) {
            if (isStudentPerp || ['Stranger', 'Co-worker', 'Colleague'].includes(complainedClassification) || relationshipType === 'classmate' || relationshipType === 'orgmate') {
                applicableLaws.push('OASH Code for Students');
            }
            if (isAuthority && !isStudentPerp) {
                applicableLaws.push('RA 7877 (Anti-Sexual Harassment Act)');
                applicableLaws.push('RACCS (RA 9710)');
                applicableLaws.push('OASH Code for Employees');
            }
            if (isIntimate) {
                applicableLaws.push('RA 9262 (VAWC) - If victim is a woman/child');
                if (isStudentPerp) applicableLaws.push('OASH Code for Students');
                else if (isEmployeePerp) applicableLaws.push('OASH Code for Employees');
            }
        } else {
            if (isEmployeePerp || isSameLevel) {
                applicableLaws.push('RA 7877 (Anti-Sexual Harassment Act)');
                applicableLaws.push('RACCS (RA 9710)');
                applicableLaws.push('OASH Code for Employees');
            }
            if (isAuthority && isEmployeePerp) {
                applicableLaws.push('RA 7877 (Anti-Sexual Harassment Act)');
                applicableLaws.push('RACCS (RA 9710)');
                applicableLaws.push('OASH Code for Employees');
            }
            if (isIntimate) {
                applicableLaws.push('RA 9262 (VAWC) - If victim is a woman/child');
                if (isStudentPerp) applicableLaws.push('OASH Code for Students');
                else if (isEmployeePerp) applicableLaws.push('OASH Code for Employees');
            }
            if (isStudentPerp && !isIntimate) applicableLaws.push('OASH Code for Students');
        }

        applicableLaws = [...new Set(applicableLaws)];
        const actualLaws = applicableLaws.filter(law => !law.includes('External Assistance'));
        const externalAssistance = applicableLaws.filter(law => law.includes('External Assistance'));
        const actionInfo = determineAction(data);

        return { applicableLaws: actualLaws, externalAssistance, recommendedAction: actionInfo };
    }

    // ---------- Get policies for laws with different strictness levels ----------
    function getPoliciesForLaws(lawNames, aiResult, context, strictness = 'strict+ai') {
        // Guard against undefined context
        if (!context) {
            console.warn('getPoliciesForLaws: context is undefined – cannot determine victim status');
            return [];
        }

        let allPolicies = [];
        const isStudentVictim = context.victimClassification === 'Student';

        lawNames.forEach(lawName => {
            let policyArray = null;
            if (lawName.includes('OASH Code for Students')) {
                policyArray = antiSexualHarassmentCode;
                if (policyArray) {
                    const studentPolicies = policyArray.filter(p => p.applicable_to && p.applicable_to.includes('students'));
                    allPolicies.push(...studentPolicies.map(p => ({ ...p, law_display_name: lawName })));
                }
            } else if (lawName.includes('OASH Code for Employees')) {
                policyArray = antiSexualHarassmentCode;
                if (policyArray) {
                    const employeePolicies = policyArray.filter(p => p.applicable_to && p.applicable_to.includes('employees'));
                    allPolicies.push(...employeePolicies.map(p => ({ ...p, law_display_name: lawName })));
                }
            } else {
                if (lawName.includes('RA 11313') || lawName.includes('Safe Spaces Act')) policyArray = irrRA11313;
                else if (lawName.includes('RA 7877')) policyArray = ra7877;
                else if (lawName.includes('RA 9262') || lawName.includes('VAWC')) policyArray = ra9262;
                else if (lawName.includes('RACCS')) policyArray = raccs;
                if (policyArray) allPolicies.push(...policyArray.map(p => ({ ...p, law_display_name: lawName })));
            }
        });

        // Filter by applicable_to
        allPolicies = allPolicies.filter(p => {
            if (!p.applicable_to) return false;
            if (isStudentVictim) {
                return p.applicable_to.some(term => ['students', 'teaching personnel', 'non-teaching personnel'].includes(term));
            } else {
                const employeeTerms = ['employees', 'teaching personnel', 'non-teaching personnel', 'government employees', 'government officials'];
                return p.applicable_to.some(term => employeeTerms.includes(term));
            }
        });

        if (strictness === 'strict+ai') {
            allPolicies = allPolicies.filter(p => p.offense_category !== undefined && p.offense_category !== null);
            allPolicies = filterPoliciesByAI(allPolicies, aiResult);
        } else if (strictness === 'strict') {
            allPolicies = allPolicies.filter(p => p.offense_category !== undefined && p.offense_category !== null);
        } // else medium or loose: no extra filter

        // Remove duplicates
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

    // ---------- Display applicable laws ----------
    function displayApplicableLaws(applicableLaws, externalAssistance, recommendedAction, aiResult, context) {
        const lawsContainer = document.getElementById('applicableLawsContainer');
        const recommendedContainer = document.getElementById('recommendedActionContainer');
        const recommendedText = document.getElementById('recommendedActionText');

        if (recommendedContainer && recommendedText && recommendedAction) {
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
            recommendedContainer.classList.remove('hidden');
        } else if (recommendedContainer) {
            recommendedText.innerHTML = '—';
        }

        if (!lawsContainer) return;

        if (aiResult && aiResult.category === 'Not Harassment') {
            lawsContainer.innerHTML = '';
            lawsContainer.style.display = 'none';
            return;
        }

        if (!context) {
            lawsContainer.innerHTML = `
                <div class="flex items-start gap-3">
                    <i class="fas fa-exclamation-triangle text-amber-600 text-xl mt-1"></i>
                    <div class="flex-1">
                        <h4 class="font-semibold text-amber-800 mb-2">⚠️ Missing Data</h4>
                        <p class="text-sm text-amber-700">Unable to map laws because report details are incomplete. Please ensure the report includes victim classification, perpetrator details, relationship, and location.</p>
                    </div>
                </div>
            `;
            lawsContainer.style.display = 'block';
            return;
        }

        if (applicableLaws && applicableLaws.length > 0 && applicableLaws[0] !== 'Please select a valid complained classification') {
            let policyDetails = getPoliciesForLaws(applicableLaws, aiResult, context, 'strict+ai');
            let usedLevel = 'strict+ai';
            if (policyDetails.length === 0 && aiResult) {
                policyDetails = getPoliciesForLaws(applicableLaws, null, context, 'strict');
                usedLevel = 'strict';
            }
            if (policyDetails.length === 0) {
                policyDetails = getPoliciesForLaws(applicableLaws, null, context, 'medium');
                usedLevel = 'medium';
            }
            if (policyDetails.length === 0) {
                policyDetails = getPoliciesForLaws(applicableLaws, null, context, 'loose');
                usedLevel = 'loose';
            }

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
                            <p class="text-sm text-gray-600 mt-3">No specific policy details found for the exact nature of this incident, but these laws provide protection.</p>
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
            if (usedLevel !== 'strict+ai') {
                let note = '';
                if (usedLevel === 'strict') note = 'Note: AI‑specific filters removed all provisions. Showing all relevant policies without AI filtering.';
                else if (usedLevel === 'medium') note = 'Note: No policies matched the exact offense category. Showing policies applicable to your role.';
                else if (usedLevel === 'loose') note = 'Note: No specific policies found for your role. Showing all provisions from these laws.';
                tabsHtml = tabsHtml.replace('<div class="mt-4 pt-3 border-t', `<div class="mt-2 text-xs text-amber-600 bg-amber-50 p-2 rounded">${note}</div><div class="mt-4 pt-3 border-t`);
            }
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
        } else {
            lawsContainer.innerHTML = `
                <div class="flex items-start gap-3">
                    <i class="fas fa-exclamation-triangle text-amber-600 text-xl mt-1"></i>
                    <div class="flex-1">
                        <h4 class="font-semibold text-amber-800 mb-2">⚠️ Incomplete Information</h4>
                        <p class="text-sm text-amber-700">Please ensure all fields are filled out correctly for accurate legal mapping.</p>
                    </div>
                </div>
            `;
            lawsContainer.style.display = 'block';
        }
    }

    // ---------- Helper functions ----------
    function getLawIcon(lawName) {
        if (lawName.includes('Safe Spaces Act')) return 'fas fa-street-view';
        if (lawName.includes('RA 7877')) return 'fas fa-briefcase';
        if (lawName.includes('RA 9262') || lawName.includes('VAWC')) return 'fas fa-heart';
        if (lawName.includes('RACCS')) return 'fas fa-building';
        if (lawName.includes('OASH Code')) return 'fas fa-gavel';
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

    // ---------- Main analysis function (accepts aiResult) ----------
    function analyzeAndDisplayLaws(aiResult) {
        const formData = getFormData();
        if (!formData.victimClassification || !formData.complainedClassification ||
            !formData.victimConstituent || !formData.complainedConstituent ||
            !formData.relationshipType || !formData.incidentLocation) {
            displayApplicableLaws(['Please complete all legal context fields'], [], null, null, formData);
            return;
        }
        const result = determineApplicableLaws(formData, aiResult);
        displayApplicableLaws(result.applicableLaws, result.externalAssistance, result.recommendedAction, aiResult, formData);
        return result;
    }

    // ---------- NEW: Map laws directly from a report object ----------
    function mapLawsFromReport(report, aiResult) {
        // Build the context object from report fields with intelligent defaults
        const context = {
            // Victim classification – try report.victimClassification, fallback to reporter's classification
            victimClassification: report.victimClassification || report.classification || '',
            complainedClassification: report.complainedClassification || '',
            victimConstituent: report.victimConstituent || '',
            complainedConstituent: report.complainedConstituent || '',
            // Relationship type – try to derive from classifications if missing
            relationshipType: report.relationshipType || deriveRelationshipType(report),
            // Incident location – use report.incidentLocation or map from complaint fields
            incidentLocation: report.incidentLocation || mapIncidentLocation(report)
        };

        // Validate required fields
        const missing = [];
        if (!context.victimClassification) missing.push('victim classification');
        if (!context.complainedClassification) missing.push('perpetrator classification');
        if (!context.victimConstituent) missing.push('victim constituent status');
        if (!context.complainedConstituent) missing.push('perpetrator constituent status');
        if (!context.incidentLocation) missing.push('incident location');

        if (missing.length) {
            console.warn('mapLawsFromReport: missing fields', missing, report);
            displayApplicableLaws(['Incomplete report data'], [], null, aiResult, context);
            return null;
        }

        const result = determineApplicableLaws(context, aiResult);
        displayApplicableLaws(result.applicableLaws, result.externalAssistance, result.recommendedAction, aiResult, context);
        return result;
    }

    // Helper to derive relationship type if not stored
    function deriveRelationshipType(report) {
        const victimClass = report.victimClassification || report.classification;
        const perpClass = report.complainedClassification;

        if (!victimClass || !perpClass) return 'unknown';

        // If both are students, likely classmates/orgmates
        if (victimClass === 'Student' && perpClass === 'Student') return 'same-level';

        // If one is faculty/staff and the other is student -> authority
        if ((victimClass === 'Student' && isEmployee(perpClass)) ||
            (isEmployee(victimClass) && perpClass === 'Student')) {
            return 'authority';
        }

        // If both are employees, could be same-level or authority (e.g., supervisor)
        if (isEmployee(victimClass) && isEmployee(perpClass)) return 'same-level';

        return 'unknown';
    }

    function isEmployee(cls) {
        return ['Professor', 'Instructor', 'Teacher', "Gov't Employee"].includes(cls);
    }

    function mapIncidentLocation(report) {
        // If we have a direct field, use it
        if (report.incidentLocation) return report.incidentLocation;

        // Check if we have complainedInsideCampus
        if (report.complainedInsideCampus === 'Yes') return 'inside_campus';
        if (report.complainedInsideCampus === 'No') {
            // Could be outside_uplb_activity if event was UPLB-sponsored? Not enough info, default to outside_not_uplb
            return 'outside_not_uplb';
        }

        // Fallback to empty (will be caught as missing)
        return '';
    }

    // ---------- Expose public methods ----------
    window.LawMapper = {
        determineApplicableLaws,
        displayApplicableLaws,
        getFormData,
        analyzeAndDisplayLaws,
        exportPolicies,
        mapLawsFromReport   // <-- new method for view button
    };
})();