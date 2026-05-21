import { CLAUSE_FRAMEWORK, type ClauseDef } from "./clauses-framework";
import type { ClauseChange, ClauseResult, ClauseSeverity, ContractVersion } from "./workflow-types";

export type SwitchedOnDeviationLevel = "High" | "Medium" | "Low" | "None";

export interface SwitchedOnAnalysisSourceRow {
  excelRow: number;
  sourceCategory: string;
  sourceClauseName: string;
  textExtract: string;
  additionalLocations: readonly string[];
  summary: string;
  sourceDeviationLevel: SwitchedOnDeviationLevel;
  actionability: string;
}

export const SWITCHED_ON_ANALYSIS_ROWS = [
  {
    "excelRow": 9,
    "sourceCategory": "Buyer Remedies",
    "sourceClauseName": "Liquidated Damages",
    "textExtract": "",
    "additionalLocations": [
      "Page 13, Policy excess: 'A policy excess must be paid by you in respect of each and every valid claim for each and every gadget being claimed for under each incident'; Page 17, Limit of Liability: 'Our liability, in respect of any one claim, will be limited to: The replacement cost of each gadget being claimed for and, in any event, shall not exceed the maximum liability for each gadget as shown on your Schedule of Insurance or the current market value of each gadget, whichever is lowest'"
    ],
    "summary": "No liquidated damages clause present; only standard policy excesses and liability limits apply.",
    "sourceDeviationLevel": "High",
    "actionability": "The contract lacks any liquidated damages mechanism for supplier breach of service obligations, milestones, or performance failures. This creates significant risk as the buyer has no predetermined financial remedy for delays or failures beyond standard insurance claim processes. Negotiate to include a liquidated damages clause providing for 10-20% of affected milestone value (or monthly service fees if no milestones exist) as compensation for supplier failures such as: delayed claim processing beyond agreed timescales, failure to meet service level commitments, or breach of performance standards. Frame this as a fair, pre-agreed remedy that avoids disputes and incentivizes performance. If the supplier resists percentage-based damages, propose fixed daily or weekly amounts tied to specific breaches (e.g., \u00a3X per day for claim processing delays beyond Y business days). Ensure any liquidated damages are genuine pre-estimates of loss and not penalties to maintain enforceability under English law."
  },
  {
    "excelRow": 10,
    "sourceCategory": "Buyer Remedies",
    "sourceClauseName": "Milestone Payments",
    "textExtract": "",
    "additionalLocations": [
      "Page 7, Period of cover: 'If you have purchased a monthly policy, your insurance starts at the time of purchase or policy start date, whichever is later, and lasts for a period of one month. It will then continue for further monthly periods provided you continue to pay your monthly premiums as they become due'; Page 16, Claims Procedures: 'you can notify the Claims Administrator through their online claims portal on the link below, as soon as possible but within 30 days following the discovery of the incident'; Page 16: 'complete and return any claim form or documents as required by the Claims Administrator as soon as possible but within 30 days following the discovery of the incident'"
    ],
    "summary": "No milestone payments defined; only premium collection schedules and claims notification deadlines exist.",
    "sourceDeviationLevel": "None",
    "actionability": "No action required. This is a consumer insurance policy, not a service delivery contract. Milestone payments tied to deliverables and acceptance criteria are not applicable to this type of agreement. The payment structure (premium collection) and the contractual framework are appropriate for an insurance product."
  },
  {
    "excelRow": 11,
    "sourceCategory": "Buyer Remedies",
    "sourceClauseName": "Remediation",
    "textExtract": "Page 11, Definitions - Taurus Warranty: 'Means the period where the Claims Administrator will resolve any defects in materials and workmanship when they repair or replace your gadget in the event of a claim, when your gadget is used normally in accordance with manufactures guidelines. For repairs the warranty provided is 3 months and for a replacement the warranty provided is 12 months. This warranty will also include the costs associated with transporting the device to and from our repair centre. The warranty does not cover wear and tear, damage by computer viruses, normal maintenance, accidental damage or any indirect loss'; Page 12, What we will cover - Breakdown: 'We will repair or replace your gadget if it suffers breakdown, providing the gadget is returned to us'",
    "additionalLocations": [
      "Page 8, Definitions - Breakdown: 'Means the actual breaking or burning out of any part of your gadget whilst in ordinary use arising from internal electronic, electrical or mechanical defects in the gadget, causing sudden stoppage of the function thereof and necessitating repair before it can resume operation'; Page 14, What we will not cover, point 9: 'any breakdown of the device if the fault would not have been covered under the manufacturer's warranty'; Page 10, Definitions - Manufacturer Warranty: 'Means the period where the manufacturer will resolve any defects in materials and workmanship when your gadget is used normally in accordance with manufactures guidelines for a period as specified by them'"
    ],
    "summary": "Insurer resolves defects under Taurus Warranty; excludes wear, maintenance, viruses, indirect losses.",
    "sourceDeviationLevel": "Medium",
    "actionability": "The contract provides remediation through the Taurus Warranty but lacks defined timeframes for completing repairs/replacements and escalation procedures if remediation fails or is delayed. Request insertion of specific timeframes (e.g., 'repair or replacement within 10 business days of receipt of the defective gadget') and an escalation mechanism (e.g., 'if remediation is not completed within the specified timeframe, the buyer may escalate to [senior contact] and the insurer shall provide a temporary replacement device at no cost'). Additionally, seek clarification that remediation includes measures to prevent recurrence of the same defect, not merely fixing the immediate problem."
  },
  {
    "excelRow": 12,
    "sourceCategory": "Buyer Remedies",
    "sourceClauseName": "Reperformance",
    "textExtract": "Page 17, Repair and Replacement Equipment: 'all repairs to gadgets are issued with a 3-month warranty (the gadget must be returned to the Claims Administrator in the event of a claim under that warranty)'; Page 12, What we will cover - Accidental Damage: 'We will repair or replace your gadget if it is damaged as the result of accidental damage, providing the gadget is returned to us'; Page 12, Breakdown: 'We will repair or replace your gadget if it suffers breakdown, providing the gadget is returned to us'; Page 14-15, What we will not cover, point 11: 'any breakdown resulting from a repair to your device carried out by a repairer that has not been authorised by the manufacturer or the Claims Administrator'; Page 15, point 15: 'any repairs or other costs for repairs carried out by anyone not authorised by us'",
    "additionalLocations": [
      "Page 17, Repair and Replacement Equipment: 'In the event that your claim is authorised, and your gadget is deemed beyond economical repair and will therefore have to be replaced, we will endeavour to replace it with a gadget of an identical specification or the equivalent value taking into account the age and condition of the gadget'; Page 17: 'All replacement items are issued with a 12-month warranty (the item must be returned to the Claims Administrator in the event of a claim under the warranty)'; Page 16, Claims Procedures: 'Not attempt to repair the item yourself or use an unauthorised repairer or this will invalidate the cover'"
    ],
    "summary": "Insurer must repair/replace defective gadgets; buyers must use authorised repairers only; warranties apply.",
    "sourceDeviationLevel": "Medium",
    "actionability": "The contract focuses on repair/replacement remedies but lacks explicit commitment that reperformance will be at no additional cost to the buyer, and doesn't clearly address what happens when the supplier's reperformance itself fails to meet requirements. Request the supplier add clear wording that: (1) all repairs and replacements under warranty are provided at no cost to the buyer (including return shipping and handling); (2) if repaired/replaced gadgets fail again within the warranty period, the supplier must reperform again at no cost or provide a full refund/replacement; and (3) the buyer retains the right to reject further repair attempts and demand replacement or refund if reperformance fails twice."
  },
  {
    "excelRow": 13,
    "sourceCategory": "Buyer Remedies",
    "sourceClauseName": "Step-In/Enhanced Cooperation",
    "textExtract": "",
    "additionalLocations": [
      "No additional locations found for this subclause"
    ],
    "summary": "No step-in or enhanced cooperation rights granted; remedies limited to complaints and ombudsman escalation.",
    "sourceDeviationLevel": "Medium",
    "actionability": "The contract lacks step-in rights that would allow the buyer to intervene during service failures or disputes. Propose adding a clause that grants the buyer step-in rights when specific triggers occur (e.g., repeated service failures, breach of critical KPIs, or material non-performance). The clause should define the conditions for step-in, the scope of buyer control during the step-in period, cost allocation, and transition-back procedures. If the supplier resists full step-in rights, negotiate for enhanced cooperation provisions requiring the supplier to provide increased reporting, allow buyer observation of remediation efforts, and implement joint action plans during service disruptions."
  },
  {
    "excelRow": 14,
    "sourceCategory": "Commercial Mechanics",
    "sourceClauseName": "Gainshare Mechanism",
    "textExtract": "",
    "additionalLocations": [
      "No references to gainshare mechanisms, cost savings sharing arrangements, formulas, thresholds, caps, or related audit rights were found throughout the contract. The document is a consumer insurance policy without supplier cost-efficiency provisions."
    ],
    "summary": "No gainshare arrangements exist in this insurance policy.",
    "sourceDeviationLevel": "High",
    "actionability": "The contract contains no gainshare mechanism, representing a complete absence of a commercial tool that could deliver mutual value and incentivize supplier efficiency. This is a material gap from best practices that eliminates potential cost savings and shared benefit opportunities for the buyer. Exact wording from playbook: Use a 50:50 gainshare split as default for transparency. Ensure the buyer defines the baseline cost or outcome upfront. All savings must be quantifiable (e.g., unit cost, time, FTE) and pre-agreed. Allow independent or buyer-led validation before payouts. Where the split deviates (e.g., 70:30), ensure pain is shared on the same terms. Introduce gainshare and painshare caps to limit financial exposure (e.g., 10% of contract value). For rolling or multi-year frameworks, apply clawback if gains are paid early but pain arises later. Exclude savings from inflation, scope changes, or buyer-driven actions. Require governance approval and include terms in contract schedules. In frameworks, prefer programme-level gainshare application rather than call-off level for simplicity and risk pooling. Guidance: Propose adding a new schedule or clause dedicated to gainshare mechanics. Frame this as a value-creation opportunity that benefits both parties and incentivizes continuous improvement. If the supplier resists complexity, start with a simplified 50:50 split on clearly measurable cost categories and build governance around quarterly reviews. Ensure baseline metrics are locked in writing before the mechanism goes live to avoid disputes."
  },
  {
    "excelRow": 15,
    "sourceCategory": "Commercial Mechanics",
    "sourceClauseName": "Inflation/CPI Clauses, Real Living Wage, National Insurance Uplift Terms",
    "textExtract": "MISS - No inflation indices, CPI, Real Living Wage, or National Insurance uplift provisions found. General premium adjustment provisions exist but lack objective economic linkage. Page 20, POLICY AMENDMENT AND RENEWAL, Automatic Renewal section: 'If the Claims Administrator need to make any changes to your policy cover or to the price of your insurance, the Claims Administrator will provide you with at least 30 days written notice of the change'",
    "additionalLocations": [
      "Page 7, INTRODUCTION, Period of cover: 'The annual premium you pay is determined by your gadget(s) and level of cover as specified at the time of purchasing or renewing the insurance'. Page 20-21, POLICY AMENDMENT AND RENEWAL, Automatic Renewal section: 'You will be contacted at least 21 days before the annual renewal date of your policy, and the Claims Administrator will tell you then if there are any changes to your premium or the policy terms and conditions'. Note: These provisions allow discretionary premium changes without reference to CPI, inflation indices, or statutory employment costs."
    ],
    "summary": "Premium changes allowed but not tied to inflation indices or statutory costs.",
    "sourceDeviationLevel": "High",
    "actionability": "The contract allows discretionary premium increases with no objective economic justification, creating significant pricing risk for the buyer. This is a material departure from best practice, which requires transparent, index-linked adjustments.\n\nGuidance:\nRequest insertion of a CPI-linked pricing mechanism to replace discretionary increases. Propose annual adjustments tied to CPI or CPIH, using a defined calculation formula (e.g., Current Index \u00f7 Base Index), with a 2-month lag and specified base year. Specify that increases apply only where CPI rises (no reductions for deflation). Negotiate a cap on annual increases (e.g., maximum 3\u20135%) to protect against volatility. Push for Year 1 pricing to remain fixed, with CPI linkage applying from Year 2 onwards. Exclude any automatic uplifts for Real Living Wage or National Insurance unless these are separately justified and capped at statutory rates only. If the supplier resists full CPI linkage, escalate to Legal to determine acceptable fallback positions, but do not accept purely discretionary pricing without objective limits."
  },
  {
    "excelRow": 16,
    "sourceCategory": "Commercial Mechanics",
    "sourceClauseName": "Rate Card Clarity (Historic vs Post-Separation)",
    "textExtract": "",
    "additionalLocations": [
      "No references to rate cards, pricing transparency requirements, transition events, company separation, or pre/post-event pricing comparisons were found. Page 20, POLICY AMENDMENT AND RENEWAL: 'premium banding' mentioned but without separation or historical comparison requirements."
    ],
    "summary": "No rate card separation or pricing transparency requirements exist.",
    "sourceDeviationLevel": "Medium",
    "actionability": "The contract lacks any rate card transparency or pricing structure requirements, particularly around transition events. Request the supplier insert a clause requiring clearly separated and itemised rate cards for pre-transition and post-transition services, with named rate categories, no retrospective price increases, and transparency on uplift drivers. Consider requesting optional caps or benchmarks for post-separation rates to prevent unjustified inflation and protect against pricing opacity during structural changes."
  },
  {
    "excelRow": 17,
    "sourceCategory": "Commercial Terms",
    "sourceClauseName": "Cost Increase/Decrease",
    "textExtract": "POLICY AMENDMENT AND RENEWAL, Page 20 'Automatic Renewal of your Policy': 'If you have a monthly policy: To make sure you have continuous cover under your policy we will automatically renew your policy each month, unless you advise the Claims Administrator otherwise and your monthly premium will be collected by the method chosen by you at the time of the initial purchase. For your convenience the Claims Administrator will write to you annually to remind you of the cover that is in place and to ensure that it still meets your needs. If the Claims Administrator need to make any changes to your policy cover or to the price of your insurance, the Claims Administrator will provide you with at least 30 days written notice of the change which will be sent to your email address provided by you at the time of purchase of the policy, or to your last known address where there is an unsuccessful email submission. Should you be unhappy with any proposed change being made to your policy, you will have the right to cancel your cover in accordance with this policy wording.' 'If you have an annual policy: You will be contacted at least 21 days before the annual renewal date of your policy, and the Claims Administrator will tell you then if there are any changes to your premium or the policy terms and conditions (which will only ever apply at your next renewal date).'",
    "additionalLocations": [
      "POLICY CANCELLATION, Page 19 'Cancellation by us': 'Where the Claims Administrator have been unable to collect an annual premium payment from you. In this case, the Claims Administrator will contact you by email after the missed collection requesting payment of the premium. If the Claims Administrator does not receive payment within 7 days, the Claims Administrator will cancel your policy with immediate effect and send you an email confirmation of the cancellation. Where the Claims Administrator have been unable to collect a monthly premium payment from you, the Claims Administrator will contact you by email after the first missed collection requesting payment of the premium. If the Claims Administrator does not receive payment by the next collection date and the next premium payment is also missed, the Claims Administrator will contact you and then cancel your policy within 7 days of this notice if your account is not bought up to date.' POLICY AMENDMENT AND RENEWAL, Page 20 'Mid-Term Adjustments': 'Should you decide to replace your gadget with a new gadget whilst your insurance is in force, we will consider transferring the benefit of the insurance subject to the item remaining within the same premium banding as your original gadget. There is no administration fee applicable for replacing a gadget within the same premium banding.'"
    ],
    "summary": "Price changes permitted only at renewal with minimum 21-30 days advance notice; buyer has cancellation right upon price change notification.",
    "sourceDeviationLevel": "Medium",
    "actionability": "The contract allows unilateral price increases at renewal with only 21-30 days' notice and no cap or limitation on the amount of increase. This creates commercial uncertainty and exposes the buyer to potentially significant cost escalation. Negotiate to add: (1) a cap on annual price increases tied to a specific index (e.g., CPI or CPI + 2%), (2) extended notice period of at least 60-90 days for any price change to allow adequate budget planning, and (3) a right to terminate without penalty if any price increase exceeds the capped amount. The current cancellation right is insufficient protection as it forces the buyer to either accept unlimited increases or lose coverage entirely. Request that any price increase be justified in writing with reference to the index or demonstrable cost increases in the supplier's delivery model."
  },
  {
    "excelRow": 18,
    "sourceCategory": "Commercial Terms",
    "sourceClauseName": "Currency and FOREX Provisions",
    "textExtract": "",
    "additionalLocations": [
      "No additional locations found beyond initial assessment."
    ],
    "summary": "Currency exchange rate provisions not specified.",
    "sourceDeviationLevel": "None",
    "actionability": "No action required. The absence of currency and FOREX provisions is appropriate where both parties are in the same jurisdiction (England and Wales) and all pricing is in GBP. Best practices confirm that currency control provisions are unnecessary in this scenario."
  },
  {
    "excelRow": 19,
    "sourceCategory": "Commercial Terms",
    "sourceClauseName": "Indexation",
    "textExtract": "",
    "additionalLocations": [
      "No additional locations found beyond initial assessment."
    ],
    "summary": "Pricing indexation provisions not included in policy.",
    "sourceDeviationLevel": "Medium",
    "actionability": "The contract lacks any indexation or price adjustment mechanism, which creates uncertainty at renewal and exposes the buyer to uncontrolled premium increases. Negotiate to include a clear pricing framework that: (1) caps any annual price increases to a defined inflation index (e.g., CPI) or a fixed percentage ceiling; (2) requires advance notice (e.g., 90 days) before any price change takes effect; and (3) establishes transparent pricing for policy extensions or additional coverage. This protects against arbitrary premium hikes while maintaining predictability for budgeting purposes."
  },
  {
    "excelRow": 20,
    "sourceCategory": "Commercial Terms",
    "sourceClauseName": "Mark-Up on Pass-Through Costs and Expenses",
    "textExtract": "",
    "additionalLocations": [
      "No additional locations found beyond initial assessment."
    ],
    "summary": "Pass-through cost mark-up provisions not specified.",
    "sourceDeviationLevel": "Medium",
    "actionability": "The contract is silent on mark-ups for pass-through costs, creating uncertainty and potential for the supplier to apply uncapped charges. Negotiate to insert explicit wording that pass-through costs must be charged at cost with zero mark-up, or if the supplier resists, accept a maximum mark-up capped at 5%. Propose adding: 'Any costs or expenses incurred by the Supplier on behalf of the Customer and passed through shall be charged at cost with no mark-up, or alternatively at cost plus a maximum mark-up of 5%.' Ensure this applies to all reimbursable expenses, third-party costs, and disbursements to prevent hidden margin inflation."
  },
  {
    "excelRow": 21,
    "sourceCategory": "Commercial Terms",
    "sourceClauseName": "Minimum Revenue or Revenue Commitments",
    "textExtract": "",
    "additionalLocations": [
      "No additional locations found beyond initial assessment."
    ],
    "summary": "Minimum revenue commitments not required.",
    "sourceDeviationLevel": "None",
    "actionability": "No action required. The clause already aligns with the Best practices. The contract contains no minimum revenue or monetary purchase commitments, which protects the buyer from being locked into spending obligations regardless of actual business needs or usage levels."
  },
  {
    "excelRow": 22,
    "sourceCategory": "Commercial Terms",
    "sourceClauseName": "Minimum Volumes or Volume Commitments",
    "textExtract": "",
    "additionalLocations": [
      "No additional locations found beyond initial assessment."
    ],
    "summary": "Minimum volume purchase commitments not required.",
    "sourceDeviationLevel": "None",
    "actionability": "No action required. The clause already aligns with the Best practices. The contract contains no minimum volume or usage commitments, which is the preferred position and protects the buyer from being locked into purchase obligations or risking loss of coverage for failing to meet thresholds."
  },
  {
    "excelRow": 23,
    "sourceCategory": "Commercial Terms",
    "sourceClauseName": "Payment Dispute Terms",
    "textExtract": "",
    "additionalLocations": [
      "No additional locations found beyond initial assessment."
    ],
    "summary": "Invoice payment dispute procedures not specified.",
    "sourceDeviationLevel": "High",
    "actionability": "The contract lacks any payment dispute mechanism, creating significant risk for the buyer if disputes arise over premiums, adjustments, or refunds. Request insertion of a structured dispute resolution process that includes: (1) written notice requirements with specified timelines (e.g., 30 days to raise a dispute); (2) escalation steps (initial review by account manager, then senior management); (3) the right to withhold disputed amounts pending resolution; and (4) defined resolution timeframes (e.g., 15 business days per escalation level). This protects the buyer from being forced to pay contested amounts without recourse and ensures predictable dispute handling."
  },
  {
    "excelRow": 24,
    "sourceCategory": "Commercial Terms",
    "sourceClauseName": "Payment Terms",
    "textExtract": "INTRODUCTION, Page 7 'Period of cover': 'Please note that your insurance may be terminated if the Claims Administrator does not receive your monthly or annual premium(s) when they are due.' 'Should any premium(s) fall into arrears due to non-payment, the Claims Administrator will automatically re-attempt to collect any outstanding premium(s). Where the Claims Administrator has been unable to collect a monthly premium payment from you they will contact you by email after the first missed collection requesting payment of the premium. Where the Claims Administrator has been unable to collect an annual premium from you, or where there are multiple missed monthly premiums, the Claims Administrator will contact you by email after the missed collection requesting payment of the outstanding amount. If your account is not bought up to date within 7 days of this email, the Claims Administrator will cancel your policy with immediate effect and send you an email confirmation of the cancellation.' 'The monthly premium you pay is determined by your gadget(s) and level of cover as specified at the time of purchasing the insurance and will be collected monthly in advance.' 'All premium collections will be administered by Taurus Insurance Services Limited.'",
    "additionalLocations": [
      "WHAT WE WILL NOT COVER, Page 14 General exclusions 3.: 'any claim for a gadget where your insurance premiums are in arrears and you do not settle the outstanding balance.' CONDITIONS AND LIMITATIONS, Page 16 'Claims Procedures': 'provide details of any other contract, guarantee, warranty or insurance that may apply to the gadget including, but not limited to, household insurance (where appropriate a rateable proportion of the claim may be recovered direct from these Insurers)' POLICY CANCELLATION, Page 19 'Cancellation by us': 'Where the Claims Administrator have been unable to collect an annual premium payment from you. In this case, the Claims Administrator will contact you by email after the missed collection requesting payment of the premium. If the Claims Administrator does not receive payment within 7 days, the Claims Administrator will cancel your policy with immediate effect and send you an email confirmation of the cancellation. Where the Claims Administrator have been unable to collect a monthly premium payment from you, the Claims Administrator will contact you by email after the first missed collection requesting payment of the premium. If the Claims Administrator does not receive payment by the next collection date and the next premium payment is also missed, the Claims Administrator will contact you and then cancel your policy within 7 days of this notice if your account is not bought up to date.' POLICY AMENDMENT AND RENEWAL, Page 21 'Automatic Renewal of your Policy': 'If the Claims Administrator are unable to collect your renewal premium your policy will lapse and the Claims Administrator will advise you accordingly.'"
    ],
    "summary": "Premiums payable monthly or annually in advance; non-payment triggers cancellation after email notice and brief cure period.",
    "sourceDeviationLevel": "High",
    "actionability": "This is an insurance premium payment structure, not standard commercial payment terms for goods or services. The contract requires immediate monthly/annual premium payment with only a 7-day cure period before cancellation, which creates significant risk of coverage loss for minor payment delays. Negotiate for: (1) extended grace period of at least 30 days before cancellation to align with commercial payment norms; (2) requirement for multiple written notices (not just email) before termination; (3) automatic reinstatement rights within a reasonable period after missed payment; (4) early payment discount option for annual premium payment in full. Emphasize that 7 days is commercially unreasonable and creates disproportionate termination risk, particularly given email notification may be missed or delayed."
  },
  {
    "excelRow": 25,
    "sourceCategory": "Commercial Terms",
    "sourceClauseName": "Pricing and Pricing Model",
    "textExtract": "INTRODUCTION, Page 7 'Period of cover': 'You had the choice to buy this insurance as either a monthly policy or an annual policy. Your choice is confirmed on your Schedule of Insurance.' 'If you have purchased an annual policy, your insurance starts at the time of purchase, renewal, or policy start date, whichever is later, and lasts for a period of twelve months provided you pay your premium when it is due. The annual premium you pay is determined by your gadget(s) and level of cover as specified at the time of purchasing or renewing the insurance.' 'If you have purchased a monthly policy, your insurance starts at the time of purchase or policy start date, whichever is later, and lasts for a period of one month. It will then continue for further monthly periods provided you continue to pay your monthly premiums as they become due. The monthly premium you pay is determined by your gadget(s) and level of cover as specified at the time of purchasing the insurance and will be collected monthly in advance.' DEFINITIONS, Page 10 'Level of Cover': 'Means the insurance option you chose for your gadgets when you purchased your policy as shown in your Schedule of Insurance. The options available are Standard, Premium or Ultimate.' WHAT WE WILL NOT COVER, Page 13 'Policy excess': Table showing 'Ultimate 150 \u00a3150', 'Ultimate 100 \u00a3100', 'Ultimate 50 \u00a350'",
    "additionalLocations": [
      "POLICY CANCELLATION, Page 18 'Cooling off Period': 'You will receive a full refund of any premium already paid provided that no claim has been made and you do not intend to make a claim.' POLICY CANCELLATION, Page 19 'After the Cooling off Period': 'If you have a monthly policy: You can cancel cover at any time by contacting Switched on Insurance. If you cancel following the 14-day cooling-off period, your cover will continue until the end of the period for which you have already paid. There will be no refund of premium due as the premium paid will have been in respect of the cover already received. If you have an annual policy: You may cancel your insurance at any time by contacting Switched on Insurance, then cover will terminate upon receipt of your notice of cancellation. The Claims Administrator will then calculate the proportionate premium for the period that you have not been insured provided you have not made a claim during the period of insurance.' POLICY AMENDMENT AND RENEWAL, Page 20 'Mid-Term Adjustments': 'Where you have multiple items registered on your policy and you wish to remove one of your gadgets from cover, the Claims Administrator will calculate the revised premium and in respect of an annual contract where there is a reduction in your premium, we will provide you with a pro-rata refund, provided you have not made a claim. In respect of a monthly policy your cover will continue for the period you have already paid, the Claims Administrator will recalculate the premium and confirm the revised premium in writing to you in good time before your next premium collection date.' POLICY AMENDMENT AND RENEWAL, Page 21 'Automatic Renewal of your Policy': 'Unless you advise us otherwise, your renewal premium will be taken by the same method used during your initial purchase.'"
    ],
    "summary": "Premium determined by gadget value and coverage tier; monthly or annual payment options; fixed pricing model with policy excess per claim.",
    "sourceDeviationLevel": "High",
    "actionability": "This is a consumer insurance policy, not a B2B services contract. The Best practices provided relate to supplier service agreements (e.g., T&M pricing, rate cards, transition events, foreign exchange risk in supply chains), which are fundamentally incompatible with an insurance product structure. The policy operates on a premium-based model with tiered cover options and policy excesses, which is standard for consumer insurance and not amenable to the commercial negotiation levers described in the Best practices (e.g., rebates for volume, indexation caps, itemised rate cards for pre/post-transition services). No meaningful action can be taken to align this insurance contract with B2B supplier service best practices, as the frameworks are categorically different. If the intent is to procure insurance for the client's business, the focus should shift to negotiating premium rates, excess levels, cover scope, and renewal terms appropriate to insurance contracts, not supplier service pricing models."
  },
  {
    "excelRow": 26,
    "sourceCategory": "Commercial Terms",
    "sourceClauseName": "Rebates and Discounts",
    "textExtract": "",
    "additionalLocations": [
      "No additional locations found beyond initial assessment."
    ],
    "summary": "Rebates and discount provisions not included.",
    "sourceDeviationLevel": "Medium",
    "actionability": "The contract does not include any rebate, discount, or early payment incentive provisions that would benefit the buyer. Request the supplier to introduce an early payment discount (e.g., 2-5% for payment within 7-14 days) and volume-based rebates or discounts that incentivize increased purchasing. These commercial terms should be clearly documented in a schedule or pricing appendix to the contract."
  },
  {
    "excelRow": 27,
    "sourceCategory": "Control and Compliance",
    "sourceClauseName": "Acceptance",
    "textExtract": "",
    "additionalLocations": [
      "Not applicable - clause not found in contract"
    ],
    "summary": "No acceptance clause found in this insurance policy document.",
    "sourceDeviationLevel": "None",
    "actionability": "No action required. This is a consumer insurance policy, not a procurement contract for deliverables or services requiring acceptance testing. Acceptance criteria are not applicable to this type of agreement, which governs insurance coverage rather than the delivery of goods or services subject to buyer acceptance procedures."
  },
  {
    "excelRow": 28,
    "sourceCategory": "Control and Compliance",
    "sourceClauseName": "Audit",
    "textExtract": "",
    "additionalLocations": [
      "Not applicable - clause not found in contract"
    ],
    "summary": "No audit rights clause found in this insurance policy document.",
    "sourceDeviationLevel": "Medium",
    "actionability": "The contract lacks audit rights, which limits the buyer's ability to verify the insurer's compliance with policy terms. Request insertion of a clause granting the policyholder (or its appointed representatives) the right to audit the insurer's relevant records, systems, and operations upon reasonable notice, with access to premises and personnel as necessary to verify compliance with the policy terms. This is a standard commercial protection that insurers should accept for transparency and accountability purposes."
  },
  {
    "excelRow": 29,
    "sourceCategory": "Control and Compliance",
    "sourceClauseName": "Benchmarking",
    "textExtract": "MISS - No benchmarking provisions, performance metrics, or cost-efficiency evaluation standards found in this insurance policy document.",
    "additionalLocations": [
      "No additional locations found - this provision does not exist in the contract."
    ],
    "summary": "No benchmarking provisions exist in this insurance policy contract.",
    "sourceDeviationLevel": "Medium",
    "actionability": "The contract lacks any benchmarking mechanism, which prevents the buyer from ensuring competitive pricing and service quality throughout the policy term. Request insertion of a benchmarking clause that grants the buyer the right to benchmark services/pricing at regular intervals (e.g., annually or biennially), with a jointly agreed benchmarker appointed at contract signing. The clause should specify that if benchmarking reveals above-market pricing, an automatic price adjustment downward will apply, and that benchmarking results cannot increase charges or worsen service levels for the buyer. This protects against price drift and ensures ongoing market competitiveness without requiring contract renegotiation."
  },
  {
    "excelRow": 30,
    "sourceCategory": "Control and Compliance",
    "sourceClauseName": "Business Continuity and Disaster Recovery",
    "textExtract": "MISS - No explicit business continuity plans, disaster recovery procedures, or service continuity provisions found in this insurance policy document.",
    "additionalLocations": [
      "No additional locations found - this provision does not exist in the contract. Note: Page 7, INTRODUCTION section references 'Period of cover' and premium collection procedures, and Page 16-17, CONDITIONS AND LIMITATIONS mentions repair warranties, but these do not constitute business continuity or disaster recovery provisions."
    ],
    "summary": "No business continuity or disaster recovery provisions exist in this insurance policy contract.",
    "sourceDeviationLevel": "Medium",
    "actionability": "Request the insurer to include business continuity and disaster recovery provisions in the policy terms or as a separate schedule. Guidance: Seek contractual commitments covering: (1) documented business continuity and disaster recovery plans with clear invocation procedures; (2) defined Recovery Time Objectives (RTOs) and Recovery Point Objectives (RPOs) for critical services such as claims processing; and (3) requirements for regular testing and updating of these plans. This ensures service continuity during operational disruptions and provides recourse if the insurer fails to maintain adequate resilience measures. Given this is an insurance policy rather than a service contract, the insurer may resist detailed operational commitments, but at minimum seek confirmation of existing BC/DR capabilities and escalation procedures during service interruptions."
  },
  {
    "excelRow": 31,
    "sourceCategory": "Control and Compliance",
    "sourceClauseName": "Confidentiality",
    "textExtract": "Page 23, Section YOUR RIGHTS, Subsection Data Protection Notice, under Sharing Your Personal Data: 'We will keep any information you have provided to us confidential. However, you agree that we may share this information with Great Lakes Insurance UK Limited and other companies within the ERGO Group and with third parties who perform services on our behalf in administering your policy, handling claims and in providing other services under your policy.'",
    "additionalLocations": [
      "Page 23, Section YOUR RIGHTS, Subsection Data Protection Notice, under Sharing Your Personal Data: 'We will also share your information if we are required to do so by law, if we are authorised to do so by you, where we need to share this information to prevent fraud.' Page 23, Section YOUR RIGHTS, Subsection Data Protection Notice, under Sharing Your Personal Data: 'Please see our Privacy Policy for more details about how we will use your information. For more information about how we will use your data, please go to: www.ergotravelinsurance.co.uk/privacy-statement'"
    ],
    "summary": "Insurer commits to confidentiality but reserves right to share information with affiliates and service providers.",
    "sourceDeviationLevel": "Medium",
    "actionability": "The clause permits broad sharing with affiliates and third-party service providers without clear restrictions on purpose limitation, data security standards, or duration of confidentiality obligations. Request that the insurer add explicit limitations: (1) restrict sharing to named categories of recipients with legitimate need-to-know only; (2) require all recipients to maintain equivalent confidentiality protections; (3) specify that data sharing is limited to the minimum necessary for the stated purposes; and (4) clarify the duration of confidentiality obligations, ideally extending beyond policy termination. Additionally, request that the insurer commit to notifying you of any material changes to data sharing practices and provide an opt-out mechanism where legally permissible."
  },
  {
    "excelRow": 32,
    "sourceCategory": "Control and Compliance",
    "sourceClauseName": "Data Breach Notification",
    "textExtract": "",
    "additionalLocations": [
      "Not applicable - clause not found in contract"
    ],
    "summary": "No data breach notification clause found in this insurance policy document.",
    "sourceDeviationLevel": "High",
    "actionability": "The contract lacks any data breach notification provision, creating significant compliance and reputational risk for the buyer. Under UK GDPR and Data Protection Act 2018, controllers must notify the ICO within 72 hours of becoming aware of a breach, and affected data subjects without undue delay where there is a risk to rights and freedoms. Request insertion of a clause requiring the supplier to: (1) notify the buyer immediately (and in any event within 24 hours) upon becoming aware of any data breach affecting the buyer's data; (2) provide full details of the breach, affected data categories, and remedial steps taken; (3) cooperate fully in any regulatory notifications or communications to affected individuals; and (4) bear costs associated with breach response unless caused by the buyer. This is essential to ensure regulatory compliance, enable timely risk mitigation, and protect the buyer from penalties and reputational damage."
  },
  {
    "excelRow": 33,
    "sourceCategory": "Control and Compliance",
    "sourceClauseName": "Data Processing",
    "textExtract": "Page 22, Section YOUR RIGHTS, Subsection Data Protection Notice, under Consent: 'We will only use your personal data when the law allows us to. Most commonly we will use your personal data under the following two circumstances: 1. When you gave explicit consent for your personal data, and that of others insured under your policy, to be collected and processed by us in accordance with this Data Protection Notice.' Page 22, under How We use Your Personal Data: 'We use your personal data for the purposes of providing you with insurance, handling claims and providing other services under your policy and any other related purposes (this may include underwriting decisions made via automated means).' Page 22: 'We collect and process your personal data in line with the General Data Protection Regulation and all other applicable Data Protection legislation.' Page 22, under Special Categories of Personal Data: 'Some of the personal data you provide to us may be more sensitive in nature and is treated as a Special Category of personal data. This could be information relating to health or criminal convictions, and may be required by us for the specific purposes of underwriting or as part of the claims handling process.'",
    "additionalLocations": [
      "Page 8, Section DEFINITIONS, under Consent: 'your agreement on your own behalf; and, Where you are the legal parent or guardian of children under the age of 16 to be insured on the policy, on their behalf; and your warranty that, your spouse or partner and any other children aged 16 and above to be insured on the policy, have given their agreement; and your warranty that, where you are NOT the legal parent or guardian of children under the age of 16 to be insured on the policy but your spouse or partner is, that your spouse or partner has given his/her agreement on their behalf.' Page 23, Section YOUR RIGHTS, Subsection Data Protection Notice: 'Your personal data will not be kept for longer than is necessary. In most cases this will be for a period of seven years following the expiry of the insurance contract, or our business relationship with you, unless we are required to retain the data for a longer period due to business, legal or regulatory requirements.' Page 23, Section YOUR RIGHTS, Subsection Data Protection Notice, under Your Rights: 'You have the right to ask us not to process your personal data for marketing purposes, to see a copy of the personal information we hold about you, to have your personal data deleted (subject to certain exemptions), to have any inaccurate or misleading data corrected or deleted, to ask us to provide a copy of your personal data to any controller and to lodge a complaint with the local data protection authority.'"
    ],
    "summary": "Personal data processed under GDPR for insurance purposes including sensitive categories with explicit consent or contractual basis.",
    "sourceDeviationLevel": "Low",
    "actionability": "The contract references GDPR compliance and outlines data processing purposes, retention periods, and data subject rights, which substantially aligns with best practices. However, request the supplier add explicit confirmation that they will maintain appropriate technical and organisational security measures to protect personal data, and clarify the respective data handling responsibilities between ERGO TIS and Taurus Insurance Services Limited as joint or separate controllers. This provides greater certainty on security standards and accountability."
  },
  {
    "excelRow": 34,
    "sourceCategory": "Control and Compliance",
    "sourceClauseName": "Data Transfer",
    "textExtract": "Page 23, Section YOUR RIGHTS, Subsection Data Protection Notice, under Sharing Your Personal Data: 'We may transfer your personal data outside of the European Economic Area ('EEA'). Where we transfer your personal data outside of the EEA, we will ensure that it is treated securely and in accordance with all applicable Data Protection legislation.'",
    "additionalLocations": [
      "No additional locations found beyond primary reference"
    ],
    "summary": "Personal data may be transferred outside EEA with security and data protection compliance assurances.",
    "sourceDeviationLevel": "Medium",
    "actionability": "The contract acknowledges international transfers but lacks specific safeguards required under UK GDPR (post-Brexit) and retained EU law. Request the supplier insert explicit transfer mechanisms such as: (1) confirmation that Standard Contractual Clauses (SCCs) or an adequacy decision applies to all transfers outside the UK/EEA; (2) a commitment to conduct Transfer Impact Assessments where required; and (3) a right for the buyer to audit compliance with transfer safeguards. This ensures enforceable protections rather than a general assurance of compliance."
  },
  {
    "excelRow": 35,
    "sourceCategory": "Control and Compliance",
    "sourceClauseName": "Governance and Escalation",
    "textExtract": "Page 21, COMPLAINTS section: 'What to do if you have a complaint or feedback. It is always the intention to provide you with a first-class service. However, if you are not happy with the service provided, or you would like to tell the Claims Administrator about something they did well, please contact the relevant personnel as detailed below. Customer Relations Officer, Taurus Insurance Services, Suite 2209-2217 Eurotowers, Europort Road, Gibraltar, Tel 0330 880 1746 (local rate call), complaints@switchedoninsurance.com. You may refer Your complaint at any time to the Financial Ombudsman Service (the FOS): http://www.financial-ombudsman.org.uk/default.htm'",
    "additionalLocations": [
      "Page 16, CONDITIONS AND LIMITATIONS, Claims Procedures section: 'How to make a claim: Online: In the event of any incident likely to give rise to making a claim, you can notify the Claims Administrator through their online claims portal on the link below, as soon as possible but within 30 days following the discovery of the incident'. Page 19, POLICY CANCELLATION, Cancellation by us section: 'We may cancel this insurance by giving you at least 30 days written notice at your last known address. Reasons we may cancel the policy are, but not limited to: If we and/or the Claims Administrator have reason to suspect you of fraud... Where this redress does not happen, the Claims Administrator will then issue cancellation'. Page 20, POLICY AMENDMENT AND RENEWAL section: 'In the event that any of your personal details change, such as address, email or contact numbers, please ensure you contact Switched on Insurance as soon as possible in order for your details to be updated and to prevent any delays when making a claim'."
    ],
    "summary": "Two-tier complaint escalation: internal Customer Relations Officer, then external Financial Ombudsman Service.",
    "sourceDeviationLevel": "Medium",
    "actionability": "The contract provides a complaints process and external ombudsman route but lacks internal governance structure, escalation timelines, and resolution SLAs that protect the buyer. Request insertion of: (1) defined escalation levels with named senior contacts beyond Customer Relations Officer; (2) mandatory response timeframes at each tier (e.g., acknowledgment within 2 business days, substantive response within 10 business days); (3) automatic escalation rights if deadlines are missed; and (4) a requirement for the insurer to provide written reasons for decisions at each stage. This creates accountability and prevents indefinite delays before the buyer can escalate to FOS."
  },
  {
    "excelRow": 36,
    "sourceCategory": "Control and Compliance",
    "sourceClauseName": "Key Personnel",
    "textExtract": "MISS - No designated Key Personnel, named individuals in critical roles, or personnel replacement terms found in this insurance policy document. The document references organizational roles (Claims Administrator, Customer Relations Officer) and includes an authorization signature by James Cottrell, Director of Taurus Insurance Services Limited (Page 6, POLICY WORDING section), but these do not constitute Key Personnel provisions as typically defined in service contracts.",
    "additionalLocations": [
      "No additional locations found - this provision does not exist in the contract. Page 3, ABOUT YOUR INSURANCE section identifies organizational entities (Taurus Insurance Services Limited, Great Lakes Insurance UK Limited, ERGO TIS) but does not designate key personnel. Page 16, Claims Procedures references the Claims Administrator as an organizational function, not key personnel."
    ],
    "summary": "No Key Personnel designations or replacement terms exist in this insurance policy contract.",
    "sourceDeviationLevel": "Low",
    "actionability": "Request the insurer designate Key Personnel for critical roles (e.g., Claims Administrator, Account Manager) by name and role, with a requirement for prior written notice and buyer approval before replacement. This ensures service continuity and allows the buyer to assess whether replacement personnel have appropriate expertise and experience."
  },
  {
    "excelRow": 37,
    "sourceCategory": "Intellectual Property Rights (IPR)",
    "sourceClauseName": "License/Rights to Use Any Buyer IPR",
    "textExtract": "MISS - No provisions found addressing the insurer's or claims administrator's rights to access, use, or license the buyer's intellectual property, including data on insured gadgets or personal information beyond data protection purposes.",
    "additionalLocations": [
      "Page 22-23 Data Protection Notice grants insurer broad rights to 'use your personal data' and 'share this information' but frames this as data processing consent under GDPR, not IP licensing. Page 16-17 Claims Procedures require buyer to provide 'proof of purchase' and 'proof of usage' but do not constitute a license grant from buyer to insurer for using buyer's proprietary information beyond claims administration."
    ],
    "summary": "No explicit IP license terms govern insurer's use of buyer information.",
    "sourceDeviationLevel": "Medium",
    "actionability": "The contract lacks clarity on how the insurer may use buyer intellectual property (including device data, usage information, and business intelligence) beyond data protection compliance. Request insertion of a clause explicitly limiting the insurer's rights to use buyer IPR solely for the purposes of administering the insurance policy, processing claims, and fulfilling obligations under the contract, with no right to exploit, commercialize, or share such IPR for the insurer's own business purposes without prior written consent. This protects the buyer from unintended broader use of proprietary information while allowing necessary operational access."
  },
  {
    "excelRow": 38,
    "sourceCategory": "Intellectual Property Rights (IPR)",
    "sourceClauseName": "License/Rights to Use IPR Created by Supplier",
    "textExtract": "MISS - No provisions found granting the buyer rights to use, access, or license any intellectual property, proprietary systems, or software tools created or employed by the insurer or claims administrator.",
    "additionalLocations": [
      "The policy grants no explicit license to buyer for using insurer systems. Page 16 references online claims portal ('www.switchedoninsurance.com/make-a-claim') but contains no terms of use or IP licensing. Page 17 mentions proprietary repair processes and warranties but establishes no IP rights for the policyholder to access or replicate such processes."
    ],
    "summary": "No license granted to buyer for insurer's proprietary systems.",
    "sourceDeviationLevel": "Medium",
    "actionability": "The contract lacks any licensing terms for buyer access to supplier systems, creating operational and transparency risks. Request insertion of a clause granting the buyer a non-exclusive, royalty-free license to access and use the insurer's online claims portal, reporting systems, and any other proprietary tools necessary for policy administration, claims submission, and audit purposes during the policy term and for a reasonable period thereafter for claims made during the term. Clarify that this license includes rights to view claims data, download reports, and audit repair processes where relevant to the buyer's obligations or entitlements under the policy."
  },
  {
    "excelRow": 39,
    "sourceCategory": "Intellectual Property Rights (IPR)",
    "sourceClauseName": "Ownership of IPR Created by Supplier",
    "textExtract": "MISS - No provisions found addressing ownership of intellectual property created by the insurer or claims administrator during policy administration or claims handling.",
    "additionalLocations": [
      "The policy references 'software or firmware' only in exclusion context at Page 15, General Exclusions point 25: 'loss of any software or firmware failures' and point 26 regarding 'software programme malicious code, Virus'. No ownership or licensing terms are established. The Data Protection Notice (Pages 22-23) addresses personal data processing but does not constitute IPR licensing provisions."
    ],
    "summary": "No IP ownership terms exist for insurer-created materials.",
    "sourceDeviationLevel": "Medium",
    "actionability": "The contract should include a clause clarifying that any intellectual property created by the insurer or claims administrator in the course of providing services under this policy (including claims assessment tools, databases, or administrative systems) remains the property of the insurer, but the buyer retains perpetual access rights to data and outputs necessary for claims verification and audit purposes. Request insertion of wording such as: 'Any intellectual property rights created by the Insurer in performing services under this Policy shall vest in the Insurer, provided that the Policyholder shall have a perpetual, irrevocable, royalty-free licence to access and use all data, reports, and outputs generated in relation to its claims for audit, compliance, and business continuity purposes.' This protects the buyer's operational needs without unreasonably restricting the insurer's proprietary systems."
  },
  {
    "excelRow": 40,
    "sourceCategory": "Intellectual Property Rights (IPR)",
    "sourceClauseName": "Ownership of Pre-existing IPR",
    "textExtract": "MISS - No provisions found addressing ownership or protection of pre-existing intellectual property, software, or firmware embedded in insured gadgets or used by either party.",
    "additionalLocations": [
      "The term 'manufacturer's warranty' appears throughout (Pages 10, 14, 17) referencing third-party IP embedded in gadgets, but no ownership clarification exists. Page 9 Gadget definition requires proof of purchase from 'UK VAT registered company' but does not address IP ownership transfer or retention by manufacturers or suppliers."
    ],
    "summary": "No pre-existing IP protection or ownership terms are defined.",
    "sourceDeviationLevel": "Medium",
    "actionability": "The contract lacks any provision clarifying ownership of pre-existing intellectual property, including software, firmware, data, and customizations embedded in or used with insured gadgets. This creates ambiguity about whether the buyer retains full ownership during repair/replacement processes or whether the insurer could claim rights. Request insertion of a clause explicitly stating: (1) all pre-existing IP in insured gadgets remains the property of the buyer or the original manufacturer/licensor, (2) the insurer acquires no ownership rights to any pre-existing IP through the policy or claims process, and (3) any data or software on gadgets undergoing repair/replacement must be handled in accordance with the buyer's IP rights. This protects the buyer from unintended IP transfers and clarifies data protection obligations during claims handling."
  },
  {
    "excelRow": 41,
    "sourceCategory": "Limitation of Liability and Indemnities",
    "sourceClauseName": "Exclusions or Other Restrictions on Buyer Recovery Under Indemnity",
    "textExtract": "Page 13-15, Section 'WHAT WE WILL NOT COVER', Subsection 'Policy excess': 'A policy excess must be paid by you in respect of each and every valid claim for each and every gadget being claimed for under each incident.' Page 14, Subsection 'Theft exclusions': 'We will not pay any claim: unless a Police crime report is provided in support of the theft. Lost property reports will not be accepted in support of the theft claim. where the gadget has been stolen from any motor vehicle, unless the vehicle is locked, and all protections are in operation (including those to prevent unauthorised keyless entry to the vehicle) and the gadget(s) is concealed out of sight so that forced and violent entry into the vehicle is required. Evidence of the thief's damage to the vehicle must be provided with your claim; where the gadget has been stolen from any premises unless force, resulting in damage to the premises, was used to gain entry or exit.' Page 14-15, Subsection 'General exclusions': 'We will not pay for: 1. any claim where the gadget has not been registered and therefore is not listed in your Schedule of Insurance. 2. any claim where the policy was purchased whilst you or the gadget(s) were not in the United Kingdom. 3. any claim for a gadget where your insurance premiums are in arrears and you do not settle the outstanding balance. 4. any claim where you have failed to take reasonable precautions to prevent damage, theft or loss.'",
    "additionalLocations": [
      "Page 14, Section 'General exclusions': 'We will not pay for: 5. any claim where the IMEI/Serial number cannot be determined from your gadget. 6. any claim where proof of usage cannot be provided or evidenced (applicable only where the gadget is a mobile phone or in respect of a laptop/tablet where user history is available). 7. any claim where the excess has not been paid to the Claims Administrator. 8. any kind of damage whatsoever unless the damaged gadget is provided for repair. 9. any breakdown of the device if the fault would not have been covered under the manufacturer's warranty. 10. any claim solely for components of your gadget that would be considered a consumable e.g. batteries 11. any breakdown resulting from a repair to your device carried out by a repairer that has not been authorised by the manufacturer or the Claims Administrator. 12. any unauthorised usage unless associated with a valid theft or loss claim. 13. any claim for a gadget which was more than 36 months old at the time of the initial purchase of the policy.' Page 15, Items 16-33 of 'General exclusions': 'any claim where there is evidence that the damage, theft or loss occurred prior to inception of the policy. any claim for a gadget that does not meet the 'Criteria' as listed within the definition of gadget. loss, damage, destruction, distortion, erasure, corruption or alteration of electronic data from any computer virus or similar mechanism. any claim for malicious damage which was caused by you or your immediate family. the VAT element of any claim if you are registered for VAT. any damage, theft or loss to SIM or memory cards in isolation. cosmetic damage to the gadget or accessories that has no effect on the functionality. any modifications that have been made from the original specifications of the gadget. any claim where you knowingly leave your gadget somewhere where you can't see it, but others can and it is at risk of being lost, stolen or damaged. loss of any software or firmware failures. any loss, damage, liability or expense directly or indirectly caused by or contributed to, or arising from, the use or operation (Cyber Attack). any claim resulting from war, invasion, acts of foreign enemies, hostilities, civil war, rebellion, revolution, insurrection, military or usurped power, riot or civil commotion, terrorist activity of any kind. any claim resulting from ionising radiation or contamination by radioactivity from any nuclear fuel. any loss, theft or accidental damage of the gadget left as checked in baggage. any loss, theft or accidental damage to the gadget as a result of confiscation of detention by customs, other officials or authorities. any expense incurred as a result of not being able to use the gadget. any claim for damage, theft or loss caused by deception. any claim for worldwide cover if your trip has been for a period of more than 120 days.' Page 18, Section 'Fraud': 'If any fraudulent or misleading claim is made or if any fraudulent or misleading means are used under this insurance, you will not be allowed to continue with your claim and your policy will be cancelled with immediate effect and no refund will be returned.'"
    ],
    "summary": "Buyer's recovery restricted by excess, exclusions, proof requirements, and procedural conditions.",
    "sourceDeviationLevel": "None",
    "actionability": "No action required. This is an insurance policy document, not a commercial contract between buyer and supplier. The exclusions listed are standard insurance policy terms that define the scope of coverage. There are no 'Best practices' provided for comparison, and the typical limitation of liability negotiation framework does not apply to insurance policies, which are regulated products with exclusions that define insurable risk rather than contractual liability caps."
  },
  {
    "excelRow": 42,
    "sourceCategory": "Limitation of Liability and Indemnities",
    "sourceClauseName": "Indemnity in Favour of Buyer",
    "textExtract": "Page 12-13, Section 'WHAT WE WILL COVER': 'Accessories In the event of a claim being agreed by the Claims Administrator in respect of your gadget, we will replace any accessories damaged, stolen or lost at the same time as your gadget up to a maximum of, either the purchase price or \u00a3250 including VAT, whichever the lesser. Accidental Damage We will repair or replace your gadget if it is damaged as the result of accidental damage, providing the gadget is returned to us. Breakdown We will repair or replace your gadget if it suffers breakdown, providing the gadget is returned to us. E-Wallet Protection If your gadget is lost or stolen, and the loss or theft is covered by your policy, we will refund the cost of unauthorised transactions made from your Credit/Debit card via your gadget, after it was lost or stolen, using an e-Wallet facility (providing an e-Wallet PIN has been set for all transactions), up to a maximum of \u00a3500 (including VAT), within 24 hours of discovering the theft or loss of your gadget. Loss If you accidentally lose your gadget, we will replace it (in respect of a valid loss claim). Malicious Damage If your gadget suffers malicious damage, we will repair or replace it. Theft If you suffer theft of your gadget, we will replace it (in respect of a valid theft claim). Unauthorised Usage Following the Theft of your gadget, we will refund the cost of unauthorised usage up to a maximum of \u00a32,500 (including VAT).'",
    "additionalLocations": [
      "Page 16, Section 'Claims Procedures': 'Where there are exceptional circumstances causing your delay in reporting your claim and where there is no additional loss to us, your claim may still be considered. You must: (Failure to observe these may invalidate your claim) report the theft or loss of your gadget to your network provider within 24 hours of discovery so they can blacklist your handset/item (where this is applicable). report the theft or loss of your gadget to the Police within 24 hours of discovery and obtain a crime reference number in support of a theft claim and a copy of the police report. Not attempt to repair the item yourself or use an unauthorised repairer or this will invalidate the cover complete and return any claim form or documents as required by the Claims Administrator as soon as possible but within 30 days following the discovery of the incident. Pay the excess as requested by the Claims Administrator provide details of any other contract, guarantee, warranty or insurance that may apply to the gadget. provide the proof of purchase of the gadget for which you are claiming. provide the proof of usage (in respect of mobile phones) from your Network that confirms the mobile phone has been in use since policy inception and up to the event giving rise to the claim.' Page 22, Section 'Financial Services Compensation Scheme': 'You may be entitled to compensation from the Financial Services Compensation Scheme (FSCS) in the UK if we cannot meet our liabilities under this policy. The level of compensation provided will depend upon the circumstances of the claim.'"
    ],
    "summary": "Insurer compensates buyer for covered losses subject to caps, exclusions, and claims procedures.",
    "sourceDeviationLevel": "None",
    "actionability": "No action required. This appears to be an insurance policy document where the insurer provides indemnity coverage to the policyholder (buyer) for various perils affecting their gadget. The structure is appropriate for this type of consumer insurance contract, with the insurer\u627f\u64d4 liability for covered losses subject to standard policy terms, limits, and claims procedures. No supplier indemnity in favour of the buyer is expected or required in this context, as the entire policy functions as the insurer's commitment to compensate the buyer for covered losses."
  },
  {
    "excelRow": 43,
    "sourceCategory": "Limitation of Liability and Indemnities",
    "sourceClauseName": "Indemnity in Favour of Supplier",
    "textExtract": "",
    "additionalLocations": [
      "No additional locations found."
    ],
    "summary": "No indemnity favouring insurer explicitly provided.",
    "sourceDeviationLevel": "None",
    "actionability": "No action required. The contract already aligns with the Best practices. The absence of an indemnity in favour of the supplier protects the buyer from having to indemnify the supplier for risks, which is the preferred position from the buyer's perspective. No indemnity clause favouring the supplier means no obligation to compensate them for losses, claims, or liabilities."
  },
  {
    "excelRow": 44,
    "sourceCategory": "Limitation of Liability and Indemnities",
    "sourceClauseName": "Liability Cap of Buyer",
    "textExtract": "Page 13, Section 'Policy excess': 'A policy excess must be paid by you in respect of each and every valid claim for each and every gadget being claimed for under each incident. Please note: For any incident that occurs within the first 31 days of the initial policy inception date an additional excess is payable over and above the standard excess as detailed below.' Page 13, Table showing: 'Level of Cover Standard Excess Additional Early Claim Excess Maximum Excess Payable Ultimate 150 \u00a3150 +\u00a350 \u00a3200 Ultimate 100 \u00a3100 +\u00a350 \u00a3150 Ultimate 50 \u00a350 +\u00a350 \u00a3100'",
    "additionalLocations": [
      "Page 16, Section 'Claims Procedures': 'Pay the excess as requested by the Claims Administrator.' Page 7, Definition of 'Excess': 'Means the initial amount you will be responsible for, as detailed on your Schedule of Insurance, dependant on the level of cover chosen, in respect of each and every valid claim for each and every gadget being claimed for under each incident. If you make a claim within the first 31 days of cover your excess will be increased by \u00a350.00.'"
    ],
    "summary": "Buyer's liability limited to excess payments of \u00a350-\u00a3200 per incident depending on coverage level.",
    "sourceDeviationLevel": "None",
    "actionability": "No action required. This is an insurance policy document where the buyer is the policyholder paying excess amounts for claims, not a commercial contract with supplier liability caps. The excess structure (\u00a350-\u00a3200 per incident) represents the buyer's cost-sharing obligation under insurance coverage, not a contractual liability cap that would require negotiation with a supplier. The Best practices regarding liability caps in commercial contracts do not apply to this insurance policy context."
  },
  {
    "excelRow": 45,
    "sourceCategory": "Limitation of Liability and Indemnities",
    "sourceClauseName": "Liability Cap of Supplier",
    "textExtract": "Page 17, Section 'Limit of Liability': 'Our liability, in respect of any one claim, will be limited to: The replacement cost of each gadget being claimed for and, in any event, shall not exceed the maximum liability for each gadget as shown on your Schedule of Insurance or the current market value of each gadget, whichever is lowest. Our liability, in respect of accessories will be limited to the replacement cost of the accessories, subject to a maximum of, either the purchase price or \u00a3250 including VAT, whatever the lesser.'",
    "additionalLocations": [
      "Page 17, Section 'Average Clause': 'Where the sum insured by you, as detailed in your Schedule of Insurance, is less than the purchase price of the gadget(s) the amount you are able to claim will be calculated as follows: Amount of Claim = Actual Loss X (sum insured / purchase price) Example: If your gadget was purchased for \u00a31000 but insured with a value of \u00a3500, 50% of its real value, we will only be liable to pay 50% of the claimed amount.' Page 14, Section 'General exclusions', Item 20: 'the VAT element of any claim if you are registered for VAT.' Page 22, Section 'Financial Services Compensation Scheme': 'You may be entitled to compensation from the Financial Services Compensation Scheme (FSCS) in the UK if we cannot meet our liabilities under this policy. The level of compensation provided will depend upon the circumstances of the claim.'"
    ],
    "summary": "Insurer's liability capped at lower of replacement cost, scheduled maximum, or market value per claim.",
    "sourceDeviationLevel": "High",
    "actionability": "This is an insurance policy, not a commercial supply contract, so standard supplier liability cap principles do not apply in the same way. The policy operates on an indemnity basis with caps tied to insured values rather than contract value. However, the Average Clause creates significant risk by reducing claims proportionally if the buyer under-insures. The exclusion of VAT for VAT-registered buyers further reduces recovery. If this were a commercial contract, negotiate removal of the Average Clause to ensure full recovery up to policy limits regardless of declared value. Seek clarity on whether the cap applies per incident or in aggregate annually. For a true supply contract, insist on liability caps of at least 100-200% of annual contract value with unlimited liability carve-outs for fraud, gross negligence, data protection breaches, information security failures, regulatory non-compliance, and third-party IP infringement. Request separate higher caps (e.g., 300% of contract value) specifically for data protection and information security breaches."
  },
  {
    "excelRow": 46,
    "sourceCategory": "Limitation of Liability and Indemnities",
    "sourceClauseName": "Recoverable Losses Against Buyer",
    "textExtract": "",
    "additionalLocations": [
      "No additional locations found."
    ],
    "summary": "No specific cost-type restrictions defined beyond excess payments.",
    "sourceDeviationLevel": "Medium",
    "actionability": "The contract lacks an explicit definition of recoverable losses against the buyer, creating potential for dispute and uncertainty about the buyer's financial exposure. Propose adding a clause that clearly defines and limits the types of losses recoverable from the buyer (e.g., limiting to direct losses only, excluding consequential losses, loss of profit, loss of reputation, or other indirect losses). This protects the buyer from open-ended liability and provides commercial certainty for both parties."
  },
  {
    "excelRow": 47,
    "sourceCategory": "Limitation of Liability and Indemnities",
    "sourceClauseName": "Recoverable Losses Against Supplier",
    "textExtract": "Page 12-13, Section 'WHAT WE WILL COVER': 'Accessories In the event of a claim being agreed by the Claims Administrator in respect of your gadget, we will replace any accessories damaged, stolen or lost at the same time as your gadget up to a maximum of, either the purchase price or \u00a3250 including VAT, whichever the lesser. Accidental Damage We will repair or replace your gadget if it is damaged as the result of accidental damage, providing the gadget is returned to us. Breakdown We will repair or replace your gadget if it suffers breakdown, providing the gadget is returned to us. E-Wallet Protection If your gadget is lost or stolen, and the loss or theft is covered by your policy, we will refund the cost of unauthorised transactions made from your Credit/Debit card via your gadget, after it was lost or stolen, using an e-Wallet facility (providing an e-Wallet PIN has been set for all transactions), up to a maximum of \u00a3500 (including VAT), within 24 hours of discovering the theft or loss of your gadget. Loss If you accidentally lose your gadget, we will replace it (in respect of a valid loss claim). Malicious Damage If your gadget suffers malicious damage, we will repair or replace it. Theft If you suffer theft of your gadget, we will replace it (in respect of a valid theft claim). Unauthorised Usage Following the Theft of your gadget, we will refund the cost of unauthorised usage up to a maximum of \u00a32,500 (including VAT).'",
    "additionalLocations": [
      "Page 16, Section 'Claims Procedures': 'provide details of any other contract, guarantee, warranty or insurance that may apply to the gadget including, but not limited to, household insurance (where appropriate a rateable proportion of the claim may be recovered direct from these Insurers).' Page 17, Section 'Repair and Replacement Equipment': 'In the event that your claim is authorised, and your gadget is deemed beyond economical repair and will therefore have to be replaced, we will endeavour to replace it with a gadget of an identical specification or the equivalent value taking into account the age and condition of the gadget.'"
    ],
    "summary": "Buyer may recover repair, replacement, accessories, e-wallet, and unauthorised usage costs within specified limits.",
    "sourceDeviationLevel": "High",
    "actionability": "This is an insurance policy document, not a commercial supply contract between buyer and supplier. The text describes what an insurer will cover for a policyholder's gadget claims, not what losses a buyer can recover from a supplier in a B2B or B2C supply relationship. To align with Best practices for a commercial contract, the parties must negotiate and insert a dedicated 'Recoverable Losses' clause that clearly defines the types of losses the buyer can recover from the supplier (e.g., direct losses, consequential losses, loss of profit, data loss, third-party claims) and any monetary caps or exclusions. This clause is entirely missing from the contract as currently drafted. Escalate to Legal to draft appropriate recoverable loss provisions tailored to the commercial relationship and negotiate their inclusion with the supplier."
  },
  {
    "excelRow": 48,
    "sourceCategory": "Limitation of Liability and Indemnities",
    "sourceClauseName": "Scope of Indemnity in Favour of Buyer",
    "textExtract": "Page 12-13, Section 'WHAT WE WILL COVER': 'Accessories In the event of a claim being agreed by the Claims Administrator in respect of your gadget, we will replace any accessories damaged, stolen or lost at the same time as your gadget up to a maximum of, either the purchase price or \u00a3250 including VAT, whichever the lesser. Accidental Damage We will repair or replace your gadget if it is damaged as the result of accidental damage, providing the gadget is returned to us. Breakdown We will repair or replace your gadget if it suffers breakdown, providing the gadget is returned to us. E-Wallet Protection If your gadget is lost or stolen, and the loss or theft is covered by your policy, we will refund the cost of unauthorised transactions made from your Credit/Debit card via your gadget, after it was lost or stolen, using an e-Wallet facility (providing an e-Wallet PIN has been set for all transactions), up to a maximum of \u00a3500 (including VAT), within 24 hours of discovering the theft or loss of your gadget. Loss If you accidentally lose your gadget, we will replace it (in respect of a valid loss claim). Malicious Damage If your gadget suffers malicious damage, we will repair or replace it. Theft If you suffer theft of your gadget, we will replace it (in respect of a valid theft claim). Unauthorised Usage Following the Theft of your gadget, we will refund the cost of unauthorised usage up to a maximum of \u00a32,500 (including VAT).'",
    "additionalLocations": [
      "Page 17, Section 'Repair and Replacement Equipment': 'all repairs to gadgets are issued with a 3-month warranty (the gadget must be returned to the Claims Administrator in the event of a claim under that warranty). In the event that your claim is authorised, and your gadget is deemed beyond economical repair and will therefore have to be replaced, we will endeavour to replace it with a gadget of an identical specification or the equivalent value taking into account the age and condition of the gadget. Where we replace the gadget(s), the replacements may be pre-owned, refurbished or remanufactured (not brand new). This is not a new for old insurance policy.' Page 12, Section 'Territorial Limits': 'This insurance covers a gadget for use in the United Kingdom. Cover is extended to include use of the gadget(s) Worldwide for unlimited trips up to a maximum of 120 days per trip, subject to any repairs being carried out in the United Kingdom by our authorised repairers.'"
    ],
    "summary": "Insurer covers specified perils with defined monetary limits and conditions.",
    "sourceDeviationLevel": "High",
    "actionability": "The contract describes insurance coverage obligations but lacks a proper indemnity protecting the buyer from third-party claims arising from the supplier's performance, intellectual property infringement, or breach of obligations. Request addition of a comprehensive indemnity clause requiring the supplier to indemnify the buyer against all third-party claims, losses, damages, and costs arising from: (1) the supplier's breach of contract; (2) infringement of third-party intellectual property rights by the supplier's services or materials; (3) the supplier's negligence or wilful misconduct; and (4) any claims by third parties relating to the supplier's performance under the contract. This indemnity should be uncapped and survive termination of the agreement."
  },
  {
    "excelRow": 49,
    "sourceCategory": "Limitation of Liability and Indemnities",
    "sourceClauseName": "Unlimited Liabilities of Buyer",
    "textExtract": "",
    "additionalLocations": [
      "No additional locations found."
    ],
    "summary": "No unlimited liability provisions found for buyer.",
    "sourceDeviationLevel": "None",
    "actionability": "No action required. The clause already aligns with the Best practices. The contract does not impose unlimited liability on the buyer beyond the specified areas, and no provision was found that would expose the buyer to catastrophic financial liability. This protects the buyer's position consistent with best practice of limiting unlimited liability to fraud and personal injury through negligence."
  },
  {
    "excelRow": 50,
    "sourceCategory": "Limitation of Liability and Indemnities",
    "sourceClauseName": "Unlimited Liabilities of Supplier",
    "textExtract": "",
    "additionalLocations": [
      "No additional locations found."
    ],
    "summary": "No unlimited liability provisions found for insurer.",
    "sourceDeviationLevel": "High",
    "actionability": "The contract lacks provisions for unlimited liability in critical areas where the buyer should have uncapped protection. This creates significant risk exposure for the buyer if the supplier commits fraud, causes personal injury through negligence, acts with gross negligence or willful misconduct, or breaches confidentiality obligations. Negotiate to add a clause explicitly carving out the following from any liability caps: (1) fraud or fraudulent misrepresentation; (2) death or personal injury caused by the supplier's negligence; (3) gross negligence or willful misconduct; and (4) breach of confidentiality obligations. These categories should be subject to unlimited liability and not restricted by any monetary cap elsewhere in the contract."
  },
  {
    "excelRow": 51,
    "sourceCategory": "Miscellaneous",
    "sourceClauseName": "Choice of Law and Jurisdiction",
    "textExtract": "Page 18, Section 'English Law': 'This Insurance shall be subject to English Law.'",
    "additionalLocations": [
      "No additional locations found that specifically reference the governing law or jurisdiction beyond the primary English Law section. The document references UK regulatory frameworks throughout (Page 3, 'ABOUT YOUR INSURANCE' section mentions FCA and PRA regulation; Page 22, 'Data Protection Notice' section references UK legal obligations) but these relate to regulatory compliance rather than contractual governing law or dispute jurisdiction."
    ],
    "summary": "Contract subject to English Law; no jurisdiction specified.",
    "sourceDeviationLevel": "Medium",
    "actionability": "The contract specifies English law as governing law but fails to specify which courts have jurisdiction over disputes. Request addition of an exclusive jurisdiction clause stating: 'The parties irrevocably agree that the courts of England and Wales shall have exclusive jurisdiction to settle any dispute arising out of or in connection with this Insurance.' This removes forum-shopping risk and provides certainty on dispute resolution venue."
  },
  {
    "excelRow": 52,
    "sourceCategory": "Miscellaneous",
    "sourceClauseName": "Dispute Resolution",
    "textExtract": "Page 21, Section 'COMPLAINTS': 'What to do if you have a complaint or feedback. It is always the intention to provide you with a first-class service. However, if you are not happy with the service provided, or you would like to tell the Claims Administrator about something they did well, please contact the relevant personnel as detailed below. Customer Relations Officer Taurus Insurance Services Suite 2209-2217 Eurotowers Europort Road, Gibraltar Tel 0330 880 1746 (local rate call) complaints@switchedoninsurance.com. You may refer Your complaint at any time to the Financial Ombudsman Service (the FOS): http://www.financial-ombudsman.org.uk/default.htm Financial Ombudsman Service Exchange Tower Harbour Exchange Square London E14 9SR Telephone: 0800 023 4567 or 0300 123 9 123 Email: complaint.info@financial-ombudsman.org.uk. These procedures do not affect your legal rights.'",
    "additionalLocations": [
      "Page 22, Section 'YOUR RIGHTS', Subsection 'Premiums and Claims': References the claims handling process which feeds into the complaints procedure. Page 22, Section 'Financial Services Compensation Scheme': Mentions alternative remedy avenue through FSCS for compensation if insurer cannot meet liabilities, providing contact details: 'Financial Services Compensation Scheme, 10th Floor, Beaufort House, 15 St. Botolph Street, London EC3A 7QU, UK or by phone on 0800 678 1100 or 0207 741 4100 or from their website at www.fscs.org.uk.' This represents an additional dispute resolution pathway for financial compensation claims."
    ],
    "summary": "Complaints to internal officer then Financial Ombudsman Service; legal rights preserved.",
    "sourceDeviationLevel": "Medium",
    "actionability": "The contract provides a complaints procedure suitable for consumer insurance but lacks a formal dispute resolution process for commercial contract disputes. Request addition of a tiered dispute resolution clause: (1) good faith negotiation between senior representatives within 14 days of written notice; (2) mediation under CEDR rules within 28 days if unresolved; (3) litigation in English courts only after exhausting steps 1-2. This provides cost-effective escalation while preserving litigation rights and clarifies jurisdiction, which is currently absent from the contract."
  },
  {
    "excelRow": 53,
    "sourceCategory": "Restrictions",
    "sourceClauseName": "Subcontracting",
    "textExtract": "MISS - No explicit subcontracting clause found in this insurance policy document. However, references to third-party service provision exist. Page 3: 'Taurus Insurance Services Limited, an insurance intermediary authorised and regulated in Gibraltar by the Financial Services Commission'. CONDITIONS AND LIMITATIONS section, Page 16: 'all repairs to gadgets are issued with a 3-month warranty'. Page 14, General exclusion 11: 'any breakdown resulting from a repair to your device carried out by a repairer that has not been authorised by the manufacturer or the Claims Administrator.'",
    "additionalLocations": [
      "Page 15, General exclusion 15: 'any repairs or other costs for repairs carried out by anyone not authorised by us.' Page 17, Repair and Replacement Equipment section: 'In the event that your claim is authorised, and your gadget is deemed beyond economical repair and will therefore have to be replaced, we will endeavour to replace it with a gadget of an identical specification or the equivalent value taking into account the age and condition of the gadget.' Page 16, Claims Procedures section: 'Not attempt to repair the item yourself or use an unauthorised repairer or this will invalidate the cover'."
    ],
    "summary": "Repairs must use authorized service providers only; unauthorized repairs void coverage.",
    "sourceDeviationLevel": "High",
    "actionability": "The policy restricts the insured's choice of repairer and invalidates cover for unauthorized repairs, but fails to disclose which subcontractors (repairers, claims administrators, replacement providers) will be used or obtain the insured's consent to their appointment. This creates significant risk as the insured has no visibility or control over service quality. Request that the insurer: (1) disclose the identity of all authorized repairers, claims administrators, and replacement service providers before policy inception; (2) obtain the insured's explicit consent to the use of these subcontractors; and (3) remove the blanket invalidation of cover for using non-authorized repairers, replacing it with a requirement that the insurer must reasonably approve alternative repairers proposed by the insured (approval not to be unreasonably withheld or delayed)."
  },
  {
    "excelRow": 54,
    "sourceCategory": "Restrictions",
    "sourceClauseName": "Use by Buyer Affiliates",
    "textExtract": "DEFINITIONS section, Page 10: 'Immediate family Means your spouse, partner or parents or your children, brothers or sisters who permanently reside with you at the address registered with us.' Page 9: 'Gadget(s) Means the gadget(s), excluding accessories, identified on your Schedule of Insurance which belong to: 1. you, or 2. a business where you have the relevant authority and responsibility to use and insure the gadget(s) owned by the business. Confirmation of this will be required in the event of a claim'. Page 12: 'You, your, yourself Means the person (aged 18 years or over) as stated on your Schedule of Insurance as the 'Insured' and any member of your immediate family who owns the gadget(s) covered by this policy.'",
    "additionalLocations": [
      "Page 10: 'Student Means your spouse, partner or parents or your children, brothers or sisters, who permanently reside with you outside of term time, and who are registered on a full-time course at a university or other place of higher education within the United Kingdom.' Page 14, General exclusion 3: 'any claim where your insurance premiums are in arrears and you do not settle the outstanding balance.' Page 14, General exclusion 4c: 'not handing your gadget to a person who is not known to you or a third party, other than your immediate family.'"
    ],
    "summary": "Coverage extends to family members and business gadgets with proper authority and confirmation.",
    "sourceDeviationLevel": "High",
    "actionability": "The policy restricts coverage to the named insured and immediate family members residing at the same address, with limited provision for business-owned gadgets requiring proof of authority. This creates a material gap from Best practices, which require buyer affiliates to be able to use goods and services under the agreement or have a clear commercial mechanism for extension. Negotiate to expand the definition of covered persons to include 'Affiliates' (defined as any entity controlling, controlled by, or under common control with the buyer) and their employees authorized by the buyer. Request removal of the permanent residence requirement and the business authority proof requirement, replacing these with a streamlined notification process for adding affiliate entities and their authorized users to the policy schedule at reasonable additional premium rates."
  },
  {
    "excelRow": 55,
    "sourceCategory": "Software",
    "sourceClauseName": "Length and Type of License Provided",
    "textExtract": "MISS - This is a gadget insurance policy, not a software license agreement. No provisions regarding software license scope, terms, restrictions on users, coverage, or duration are found in this contract.",
    "additionalLocations": [
      "Page 14-15, Section 'WHAT WE WILL NOT COVER', Point 25: 'loss of any software or firmware failures.' This is an exclusion clause stating the policy does not cover software-related failures, not a software license provision."
    ],
    "summary": "No software license provisions exist in this gadget insurance policy.",
    "sourceDeviationLevel": "None",
    "actionability": "No action required. This is a gadget insurance policy, not a software license agreement. Software licensing provisions are not applicable to this contract type. The reference to software in the exclusions clause is appropriate for defining what the insurance does not cover and does not create a deviation from best practices for software licensing."
  },
  {
    "excelRow": 56,
    "sourceCategory": "Software",
    "sourceClauseName": "License Renewal Terms",
    "textExtract": "MISS - This is a gadget insurance policy, not a software license agreement. However, policy renewal terms are found at Page 20, Section 'Automatic Renewal of your Policy': 'If you have an annual policy: You will be contacted at least 21 days before the annual renewal date of your policy, and the Claims Administrator will tell you then if there are any changes to your premium or the policy terms and conditions.'",
    "additionalLocations": [
      "Page 20, Section 'Automatic Renewal of your Policy': 'If you have a monthly policy: To make sure you have continuous cover under your policy we will automatically renew your policy each month, unless you advise the Claims Administrator otherwise.' Additional renewal provisions found throughout the POLICY AMENDMENT AND RENEWAL section."
    ],
    "summary": "Policy renewal terms exist but relate to insurance coverage, not software licenses.",
    "sourceDeviationLevel": "None",
    "actionability": "No action required. This is a gadget insurance policy, not a software license agreement, so software license renewal terms are not applicable to this contract. The document appropriately contains insurance policy renewal provisions instead."
  },
  {
    "excelRow": 57,
    "sourceCategory": "Software",
    "sourceClauseName": "Support and Maintenance Terms",
    "textExtract": "MISS - This is a gadget insurance policy, not a software license agreement. No provisions regarding software support and maintenance terms are found in this contract.",
    "additionalLocations": [
      "Page 8, Section 'DEFINITIONS', Taurus Warranty: 'The warranty does not cover wear and tear, damage by computer viruses, normal maintenance, accidental damage or any indirect loss.' This warranty relates to repaired gadgets, not software support."
    ],
    "summary": "No software support or maintenance terms exist in this contract.",
    "sourceDeviationLevel": "None",
    "actionability": "No action required. This is a gadget insurance policy, not a software license or service agreement. Software support and maintenance terms are not applicable to this type of contract. No negotiation is needed on this point."
  },
  {
    "excelRow": 58,
    "sourceCategory": "Software",
    "sourceClauseName": "Upgrades and Upgrade Obligations",
    "textExtract": "MISS - This is a gadget insurance policy, not a software license agreement. No provisions regarding supplier responsibilities for software updates or upgrades are found in this contract.",
    "additionalLocations": [
      "No additional locations found. The contract contains no provisions regarding software updates or upgrades."
    ],
    "summary": "No software upgrade obligations exist in this contract.",
    "sourceDeviationLevel": "None",
    "actionability": "No action required. This is a gadget insurance policy, not a software license or service agreement. Software upgrade obligations are not applicable to this contract type. Best practices regarding software updates, releases, and configuration are relevant only to software supply or SaaS agreements, not insurance policies."
  },
  {
    "excelRow": 59,
    "sourceCategory": "Software",
    "sourceClauseName": "Uptime and Downtime Commitments",
    "textExtract": "MISS - This is a gadget insurance policy, not a software license agreement. No provisions regarding service availability standards or acceptable downtime limits are found in this contract.",
    "additionalLocations": [
      "No additional locations found. The contract contains no provisions regarding uptime or downtime commitments for software or services."
    ],
    "summary": "No uptime or downtime commitments exist in this contract.",
    "sourceDeviationLevel": "None",
    "actionability": "No action required. This is a gadget insurance policy, not a software license or SaaS agreement. Uptime and downtime commitments are not applicable to this type of contract, which governs insurance coverage for physical devices rather than software service delivery."
  },
  {
    "excelRow": 60,
    "sourceCategory": "Supplier Obligations",
    "sourceClauseName": "Service Credits",
    "textExtract": "MISS - This insurance policy document does not contain service credit provisions. There are no financial penalties, rebates, or credits payable by the insurer for failure to meet service performance standards or timelines.",
    "additionalLocations": [
      "No additional locations found. This clause type does not exist in this insurance policy document."
    ],
    "summary": "No financial credits for service failures are provided.",
    "sourceDeviationLevel": "High",
    "actionability": "The complete absence of service credits creates significant risk for the buyer, as there is no financial remedy for insurer performance failures or delays. This is a material gap from best practices. Negotiate to introduce a service credit regime that: (1) identifies key performance metrics or service timelines (e.g., claims processing time, response to queries); (2) specifies percentage reductions (e.g., 5-10% of relevant fees) for each failure event; (3) caps total credits at 10-20% of applicable charges; and (4) clarifies that service credits are not the buyer's exclusive remedy. If the insurer resists introducing service credits on the basis that this is an insurance policy rather than a service contract, escalate to Legal to determine whether performance standards and associated financial consequences are appropriate for this arrangement."
  },
  {
    "excelRow": 61,
    "sourceCategory": "Supplier Obligations",
    "sourceClauseName": "Service Levels",
    "textExtract": "MISS - This insurance policy document does not contain service level commitments, KPIs, or performance timelines that the insurer must meet. The document specifies requirements for the policyholder (e.g., reporting within 24-30 days) but does not establish measurable service standards or response times for the insurer.",
    "additionalLocations": [
      "No additional locations found. The document contains policyholder obligations and claim notification timeframes but no insurer service level commitments."
    ],
    "summary": "No service level agreements or performance metrics are defined.",
    "sourceDeviationLevel": "High",
    "actionability": "This is an insurance policy document, not a service contract, so traditional service levels (uptime, response times, service credits) are not typically applicable or negotiable in standard insurance terms. However, the buyer can request the insurer to commit to specific claims handling timelines and performance standards. Guidance: Negotiate for the inclusion of measurable commitments such as: (1) acknowledgment of claims within [X] business days of notification; (2) initial assessment and decision on liability within [Y] business days; (3) payment of approved claims within [Z] business days of settlement agreement; (4) defined escalation procedures for delayed or disputed claims; and (5) consequences for failure to meet these timelines, such as interest on delayed payments or the right to escalate to senior management. If the insurer resists formal service levels, seek at least a service charter or claims handling protocol as an appendix to the policy that sets expectations, even if not contractually binding. Legal escalation may be required to draft appropriate insurance-specific performance commitments that balance enforceability with market practice."
  },
  {
    "excelRow": 62,
    "sourceCategory": "Supplier Obligations",
    "sourceClauseName": "Service Scope",
    "textExtract": "PART I, Section 'WHAT WE WILL COVER' (Page 12): 'Accessories: In the event of a claim being agreed by the Claims Administrator in respect of your gadget, we will replace any accessories damaged, stolen or lost at the same time as your gadget up to a maximum of, either the purchase price or \u00a3250 including VAT, whichever the lesser. Accidental Damage: We will repair or replace your gadget if it is damaged as the result of accidental damage, providing the gadget is returned to us. Breakdown: We will repair or replace your gadget if it suffers breakdown, providing the gadget is returned to us.'",
    "additionalLocations": [
      "PART I, Section 'Repair and Replacement Equipment' (Page 17): 'In the event that your claim is authorised, and your gadget is deemed beyond economical repair and will therefore have to be replaced, we will endeavour to replace it with a gadget of an identical specification or the equivalent value taking into account the age and condition of the gadget.' Section 'Territorial Limits' (Page 13): 'This insurance covers a gadget for use in the United Kingdom. Cover is extended to include use of the gadget(s) Worldwide for unlimited trips up to a maximum of 120 days per trip, subject to any repairs being carried out in the United Kingdom by our authorised repairers.'"
    ],
    "summary": "Describes covered events and claim types without performance standards.",
    "sourceDeviationLevel": "Medium",
    "actionability": "The scope is reasonably detailed regarding what is covered (accessories up to \u00a3250, accidental damage, breakdown, territorial limits, and replacement approach), but it lacks critical service delivery standards that create commercial risk for the buyer. Request the supplier add: (1) specific repair/replacement timelines (e.g., 'repair completed within 10 working days' or 'replacement dispatched within 5 working days of claim approval'); (2) quality standards for replacements (clarify whether 'equivalent value' means new, refurbished, or like-for-like functionality); (3) explicit exclusions for any boundary services to eliminate ambiguity (e.g., software issues, cosmetic damage, water damage beyond certain ratings); and (4) remedies for service failures (e.g., compensation, alternative arrangements if timelines breached). These additions protect the buyer from indefinite delays and unclear service quality while maintaining the existing coverage scope."
  },
  {
    "excelRow": 63,
    "sourceCategory": "Supplier Obligations",
    "sourceClauseName": "Supplier Performance & Delivery Obligations",
    "textExtract": "MISS - This insurance policy document does not contain supplier performance or delivery obligations in the procurement context. The document defines policyholder obligations and insurer coverage terms, but does not establish service delivery performance standards or obligations from the insurer's perspective.",
    "additionalLocations": [
      "No additional locations found. This clause type does not exist in this insurance policy document."
    ],
    "summary": "No supplier performance obligations exist in this document.",
    "sourceDeviationLevel": "High",
    "actionability": "This appears to be an insurance policy rather than a procurement contract for goods or services. If this document is intended to govern a commercial relationship where the insurer is acting as a supplier of services, fundamental restructuring is required to include: (1) specific performance standards and service levels (e.g., claims processing timeframes, response times, reporting obligations); (2) measurable quality and quantity metrics; and (3) milestone dates for delivery of services. However, if this is a standard insurance policy, supplier performance obligations may not be the appropriate framework. Legal escalation is recommended to clarify the nature of the commercial relationship and whether procurement-style performance obligations are appropriate for this document type, or whether a separate service schedule or SLA should be negotiated alongside the insurance policy."
  },
  {
    "excelRow": 64,
    "sourceCategory": "Term and Termination",
    "sourceClauseName": "Costs of Exit",
    "textExtract": "PART I, Section 'POLICY CANCELLATION - After the Cooling off Period' (page 19): 'If you have a monthly policy: You can cancel cover at any time by contacting Switched on Insurance. If you cancel following the 14-day cooling-off period, your cover will continue until the end of the period for which you have already paid. There will be no refund of premium due as the premium paid will have been in respect of the cover already received. If you have an annual policy: You may cancel your insurance at any time by contacting Switched on Insurance, then cover will terminate upon receipt of your notice of cancellation. The Claims Administrator will then calculate the proportionate premium for the period that you have not been insured provided you have not made a claim during the period of insurance. If a claim has been made during the period of insurance no refund of premium will be due.' Section 'Cancellation by us' (page 19): 'If we cancel cover under your policy, then no further premium will be payable by you.'",
    "additionalLocations": [
      "PART I, Section 'POLICY CANCELLATION - Cooling off Period' (page 18): 'You will receive a full refund of any premium already paid provided that no claim has been made and you do not intend to make a claim.' Section 'Cancellation by us' (page 19): Details scenarios where Claims Administrator cancels for non-payment: 'Where the Claims Administrator have been unable to collect an annual premium payment from you. In this case, the Claims Administrator will contact you by email after the missed collection requesting payment of the premium. If the Claims Administrator does not receive payment within 7 days, the Claims Administrator will cancel your policy with immediate effect.' Section 'POLICY AMENDMENT AND RENEWAL - Mid-Term Adjustments' (page 20): 'Where you have multiple items registered on your policy and you wish to remove one of your gadgets from cover, the Claims Administrator will calculate the revised premium and in respect of an annual contract where there is a reduction in your premium, we will provide you with a pro-rata refund, provided you have not made a claim.'"
    ],
    "summary": "Defines refund entitlements based on policy type, timing, and claims; varies by cancellation initiator.",
    "sourceDeviationLevel": "High",
    "actionability": "The contract imposes exit costs on the buyer in most scenarios (no refund for monthly policies post-cooling-off; no refund for annual policies if any claim made), which materially deviates from best practice where the supplier should bear exit costs except for buyer fault. The buyer faces full premium forfeiture even for unused coverage periods on monthly policies, and loses all refund rights on annual policies after a single claim regardless of remaining term. Negotiate to introduce a capped exit cost structure with pro-rata refunds available in all voluntary termination scenarios, subject only to reasonable deductions for actual administrative costs incurred by the supplier (not speculative loss of profit). Push for a declining scale where exit costs reduce over the policy term and reach zero at natural expiry. As a minimum fallback position, ensure pro-rata refunds apply to annual policies regardless of claims history, with deductions limited to documented costs directly attributable to the termination, and eliminate the blanket 'no refund' rule for monthly policies by allowing refunds for any unused days in the final payment period."
  },
  {
    "excelRow": 65,
    "sourceCategory": "Term and Termination",
    "sourceClauseName": "Exit Support & Obligations",
    "textExtract": "PART I, Section 'POLICY CANCELLATION' (page 18): 'To satisfy our obligations under the GDPR a policy will only be considered as cancelled once the Claims Administrator have verified the identity of the requester and confirmed either verbally or in writing that the cancellation request has been processed.' Section 'Cancellation by us' (page 19): 'We may cancel this insurance by giving you at least 30 days written notice at your last known address.' Section 'Repair and Replacement Equipment' (page 17): 'Where replacement equipment has been issued and the original gadget is recovered, the original gadget becomes our property and must be returned to the Claims Administrator immediately. Please call the Claims Administrator 0330 880 1746 (local call rate) and they will provide details for its return.'",
    "additionalLocations": [
      "PART I, Section 'POLICY CANCELLATION - Cooling off Period' (page 18): 'You may cancel the insurance within 14 days of receiving the insurance documents, should you decide the insurance is no longer appropriate or required, please contact Switched on Insurance via email at gadget.sales@switchedoninsurance.com or by calling 0207 183 6081.' Section 'After the Cooling off Period' (page 19): Details cancellation procedures for both monthly and annual policies requiring contact with Switched on Insurance. Section 'POLICY AMENDMENT AND RENEWAL - Automatic Renewal of your Policy' (page 20): 'If you do not want to auto renew your policy, you just need to contact Switched on Insurance via the contact details provided in the renewal notice.' Section 'Cancellation by us' (page 19): 'You will continue to receive any benefits for a valid claim if your claim incident date was prior to the date your policy expired.'"
    ],
    "summary": "Specifies cancellation procedures, notice periods, and property return obligations; limited transition support provisions.",
    "sourceDeviationLevel": "High",
    "actionability": "The contract lacks any exit support or transition assistance provisions. For an insurance policy, this creates risk if the buyer needs to transition to a new provider, particularly regarding claims data, policy history, or ongoing claims management. Request addition of an exit support clause requiring the insurer to provide reasonable cooperation during transition, including transfer of policy records, claims history, and continuation support for any claims in progress. Propose a 60-90 day transition period with specific deliverables: provision of all policy documentation, claims data in usable format, and reasonable assistance to facilitate handover to a successor insurer. The current provisions only address cancellation mechanics and return of replaced equipment, but provide no framework for orderly exit or knowledge transfer."
  },
  {
    "excelRow": 66,
    "sourceCategory": "Term and Termination",
    "sourceClauseName": "Partial Termination",
    "textExtract": "PART I, Section 'POLICY AMENDMENT AND RENEWAL - Mid-Term Adjustments' (page 20): 'Where you have multiple items registered on your policy and you wish to remove one of your gadgets from cover, the Claims Administrator will calculate the revised premium and in respect of an annual contract where there is a reduction in your premium, we will provide you with a pro-rata refund, provided you have not made a claim. In respect of a monthly policy your cover will continue for the period you have already paid, the Claims Administrator will recalculate the premium and confirm the revised premium in writing to you in good time before your next premium collection date.'",
    "additionalLocations": [
      "PART I, Section 'POLICY CANCELLATION - After the Cooling off Period' (page 19): Reference to termination of coverage when stating 'You can cancel cover at any time' and 'your cover will continue until the end of the period for which you have already paid' for monthly policies. Section 'Cancellation by us' (page 19): Discusses partial scenarios where 'the Claims Administrator will contact you by email after the first missed collection requesting payment of the premium. If the Claims Administrator does not receive payment by the next collection date and the next premium payment is also missed, the Claims Administrator will contact you and then cancel your policy within 7 days.'"
    ],
    "summary": "Allows removal of individual gadgets with premium adjustment; refunds conditional on policy type and claims.",
    "sourceDeviationLevel": "Low",
    "actionability": "The contract already permits partial termination by allowing removal of individual gadgets with premium adjustments, which aligns with the principle of severable service termination. However, consider negotiating to remove the restriction that prevents pro-rata refunds on annual policies where a claim has been made, as this limitation reduces flexibility. Request that refunds be calculated based on the unused portion of coverage for the removed item, regardless of claims history on other items, since the services are severable."
  },
  {
    "excelRow": 67,
    "sourceCategory": "Term and Termination",
    "sourceClauseName": "Renewal and Extension Terms",
    "textExtract": "Page 20, Section 'Automatic Renewal of your Policy': 'If you have a monthly policy: To make sure you have continuous cover under your policy we will automatically renew your policy each month, unless you advise the Claims Administrator otherwise and your monthly premium will be collected by the method chosen by you at the time of the initial purchase.' 'If you have an annual policy: You will be contacted at least 21 days before the annual renewal date of your policy, and the Claims Administrator will tell you then if there are any changes to your premium or the policy terms and conditions (which will only ever apply at your next renewal date). The Claims Administrator will then renew your insurance unless you advise us otherwise.'",
    "additionalLocations": [
      "Page 20, Section 'Mid-Term Adjustments': 'Should you decide to replace your gadget with a new gadget whilst your insurance is in force, we will consider transferring the benefit of the insurance subject to the item remaining within the same premium banding as your original gadget.' Page 20, Section 'Automatic Renewal of your Policy' - monthly policy: 'For your convenience the Claims Administrator will write to you annually to remind you of the cover that is in place and to ensure that it still meets your needs. If the Claims Administrator need to make any changes to your policy cover or to the price of your insurance, the Claims Administrator will provide you with at least 30 days written notice of the change.' Page 21, Section 'Automatic Renewal of your Policy' - annual policy: 'Unless you advise us otherwise, your renewal premium will be taken by the same method used during your initial purchase. If your payment details have changed, you can contact Switched on Insurance at gadget.sales@switchedoninsurance.com or visit www.switchedoninsurance.com and log into My Account to amend your details. Unless you advise the Claims Administrator to the contrary we will automatically renew your policy. If the Claims Administrator are unable to collect your renewal premium your policy will lapse and the Claims Administrator will advise you accordingly.'"
    ],
    "summary": "Policies automatically renew unless buyer cancels; insurer provides 21-30 days notice of changes.",
    "sourceDeviationLevel": "Medium",
    "actionability": "The contract imposes automatic renewal for both monthly and annual policies, creating financial lock-in and requiring the buyer to actively cancel to avoid unintended renewals. This deviates from best practice, which recommends either requiring positive action to renew or providing clear opt-out mechanisms without automatic continuation. Request amendment to remove automatic renewal provisions and replace with a requirement that the contract expires at the end of each term unless the buyer provides express written consent to renew. As a fallback position, if the supplier insists on automatic renewal, negotiate for: (1) extended notice periods of at least 60 days before renewal (not 21-30 days), (2) explicit opt-out mechanisms prominently displayed in all renewal communications, and (3) a contractual right for the buyer to cancel within 14 days of any renewal without penalty if terms or premiums have changed."
  },
  {
    "excelRow": 68,
    "sourceCategory": "Term and Termination",
    "sourceClauseName": "Term of Contract",
    "textExtract": "Page 7, Section 'Period of cover': 'If you have purchased an annual policy, your insurance starts at the time of purchase, renewal, or policy start date, whichever is later, and lasts for a period of twelve months provided you pay your premium when it is due.' 'If you have purchased a monthly policy, your insurance starts at the time of purchase or policy start date, whichever is later, and lasts for a period of one month. It will then continue for further monthly periods provided you continue to pay your monthly premiums as they become due.'",
    "additionalLocations": [
      "Page 7, Section 'Introduction': 'Please note that your insurance may be terminated if the Claims Administrator does not receive your monthly or annual premium(s) when they are due. Should any premium(s) fall into arrears due to non-payment, the Claims Administrator will automatically re-attempt to collect any outstanding premium(s).' 'If your account is not bought up to date within 7 days of this email, the Claims Administrator will cancel your policy with immediate effect and send you an email confirmation of the cancellation.' Page 6, Section 'POLICY WORDING': 'This is your Policy wording. It tells you everything that is covered and what is not covered. It must be read in conjunction with your Schedule of Insurance.' Page 7, Section 'INTRODUCTION': 'This insurance policy provides insurance for your registered gadget(s) whilst your policy is in force, as shown in your Schedule of Insurance, subject to the terms, conditions, and limitations shown below.'"
    ],
    "summary": "Policy term is monthly or annual, continuing only if premiums paid when due.",
    "sourceDeviationLevel": "High",
    "actionability": "This is an insurance policy with automatic monthly/annual renewal tied to premium payment, not a service contract with negotiable terms. The structure creates significant commercial disadvantage: (1) no fixed long-term commitment to secure volume discounts, (2) unilateral termination right for non-payment within 7 days creates instability, (3) no price protection against premium increases at renewal, and (4) the buyer has no negotiating leverage for extensions or better rates. Negotiate for: a multi-year fixed-price commitment with guaranteed premium rates (e.g., 3-5 years) in exchange for volume discount; explicit opt-in renewal process rather than automatic rollover to allow renegotiation; extended grace period for payment (minimum 30 days) before termination; and contractual caps on annual premium increases. If this is a standard insurance product with no negotiation possible, escalate to Legal to assess whether alternative providers offer more favourable commercial terms or consider self-insurance options for the risk being covered."
  },
  {
    "excelRow": 69,
    "sourceCategory": "Term and Termination",
    "sourceClauseName": "Termination for Cause",
    "textExtract": "Page 19, Section 'Cancellation by us': 'We may cancel this insurance by giving you at least 30 days written notice at your last known address. Reasons we may cancel the policy are, but not limited to: If we and/or the Claims Administrator have reason to suspect you of fraud; Where the Claims Administrator have been unable to collect an annual premium payment from you. In this case, the Claims Administrator will contact you by email after the missed collection requesting payment of the premium. If the Claims Administrator does not receive payment within 7 days, the Claims Administrator will cancel your policy with immediate effect and send you an email confirmation of the cancellation. Where the Claims Administrator have been unable to collect a monthly premium payment from you, the Claims Administrator will contact you by email after the first missed collection requesting payment of the premium.'",
    "additionalLocations": [
      "Page 19, Section 'Cancellation by us': 'Where there is significant adverse claims experience If any of the above reasons should occur, we and/or the Claims Administrator may write to you with our concerns and ask you to redress them. Where this redress does not happen, the Claims Administrator will then issue cancellation. If we cancel cover under your policy, then no further premium will be payable by you. You will continue to receive any benefits for a valid claim if your claim incident date was prior to the date your policy expired.' Page 7, Section 'Period of cover': 'Where the Claims Administrator has been unable to collect a monthly premium payment from you they will contact you by email after the first missed collection requesting payment of the premium. Where the Claims Administrator has been unable to collect an annual premium from you, or where there are multiple missed monthly premiums, the Claims Administrator will contact you by email after the missed collection requesting payment of the outstanding amount.' Page 18, Section 'Fraud': 'If any fraudulent or misleading claim is made or if any fraudulent or misleading means are used under this insurance, you will not be allowed to continue with your claim and your policy will be cancelled with immediate effect and no refund will be returned.'"
    ],
    "summary": "Insurer can cancel with 30 days notice for fraud, non-payment, or adverse claims experience.",
    "sourceDeviationLevel": "Medium",
    "actionability": "The contract allows the insurer broad termination rights including vague grounds like 'significant adverse claims experience' without clear definition, and permits immediate cancellation for non-payment after only 7 days. Request the supplier to: (1) define 'significant adverse claims experience' with objective criteria or remove this ground entirely; (2) extend the cure period for non-payment to at least 14-21 days to align with reasonable payment processing times; (3) require written notice specifying the exact breach and providing a reasonable opportunity to cure before termination takes effect. These changes will provide the buyer with clearer expectations and fairer opportunity to remedy issues before losing coverage."
  },
  {
    "excelRow": 70,
    "sourceCategory": "Term and Termination",
    "sourceClauseName": "Termination for Convenience on Notice",
    "textExtract": "Page 18-19, Section 'POLICY CANCELLATION' - 'Cooling off Period': 'You may cancel the insurance within 14 days of receiving the insurance documents, should you decide the insurance is no longer appropriate or required, please contact Switched on Insurance via email at gadget.sales@switchedoninsurance.com or by calling 0207 183 6081. You will receive a full refund of any premium already paid provided that no claim has been made and you do not intend to make a claim.' Section 'After the Cooling off Period': 'If you have a monthly policy: You can cancel cover at any time by contacting Switched on Insurance. If you cancel following the 14-day cooling-off period, your cover will continue until the end of the period for which you have already paid.' 'If you have an annual policy: You may cancel your insurance at any time by contacting Switched on Insurance, then cover will terminate upon receipt of your notice of cancellation.'",
    "additionalLocations": [
      "Page 18, Section 'POLICY CANCELLATION': 'To satisfy our obligations under the GDPR a policy will only be considered as cancelled once the Claims Administrator have verified the identity of the requester and confirmed either verbally or in writing that the cancellation request has been processed.' Page 19, Section 'After the Cooling off Period': 'The Claims Administrator will then calculate the proportionate premium for the period that you have not been insured provided you have not made a claim during the period of insurance. If a claim has been made during the period of insurance no refund of premium will be due.' Page 20, Section 'Automatic Renewal of your Policy': 'Should you be unhappy with any proposed change being made to your policy, you will have the right to cancel your cover in accordance with this policy wording.' Page 21, Section 'Automatic Renewal of your Policy': 'If you do not want to auto renew your policy, you just need to contact Switched on Insurance via the contact details provided in the renewal notice.'"
    ],
    "summary": "Buyer can cancel anytime; full refund only within 14-day cooling-off period without claims.",
    "sourceDeviationLevel": "Medium",
    "actionability": "The contract provides termination rights but with unfavorable financial terms compared to best practices. Negotiate to remove the restriction that denies refunds if a claim has been made or is intended\u2014this penalizes legitimate use of the insurance. For monthly policies, seek a pro-rata refund after the cooling-off period (currently no refund is given despite ongoing premium payments). Consider extending the cooling-off period beyond 14 days if commercially feasible. Ensure the supplier does not have equivalent termination for convenience rights, as best practices recommend asymmetry favoring the buyer. The notice period for annual policy cancellation (immediate upon receipt) is acceptable, but clarify that 'receipt' means buyer's notice, not supplier's processing confirmation, to avoid delays in termination taking effect."
  },
  {
    "excelRow": 71,
    "sourceCategory": "Warranties & Liability",
    "sourceClauseName": "Defect Liability Period",
    "textExtract": "CONDITIONS AND LIMITATIONS, Page 17, Repair and Replacement Equipment: 'all repairs to gadgets are issued with a 3-month warranty (the gadget must be returned to the Claims Administrator in the event of a claim under that warranty)' and 'All replacement items are issued with a 12-month warranty (the item must be returned to the Claims Administrator in the event of a claim under the warranty)'",
    "additionalLocations": [
      "DEFINITIONS, Page 10: 'Manufacturer Warranty - Means the period where the manufacturer will resolve any defects in materials and workmanship when your gadget is used normally in accordance with manufactures guidelines for a period as specified by them.' DEFINITIONS, Page 8, Breakdown: 'Means the actual breaking or burning out of any part of your gadget whilst in ordinary use arising from internal electronic, electrical or mechanical defects in the gadget'. WHAT WE WILL NOT COVER, Page 14, General exclusions point 10: 'any claim solely for components of your gadget that would be considered a consumable e.g. batteries'"
    ],
    "summary": "Repairs warranted for 3 months; replacements for 12 months. Defective gadgets must be returned during warranty period.",
    "sourceDeviationLevel": "Medium",
    "actionability": "The contract provides short defect liability periods (3 months for repairs, 12 months for replacements) which may be insufficient for the buyer to identify latent defects, particularly for repaired items. Negotiate to extend the defect liability period to at least 12 months for both repairs and replacements, ensuring alignment with typical consumer expectations and allowing adequate time to discover defects arising from faulty workmanship or materials. Additionally, clarify that the supplier must rectify defects at no additional cost to the buyer during this period, and consider removing or limiting exclusions that could undermine warranty coverage (such as the battery exclusion, which may be used to deny legitimate claims)."
  },
  {
    "excelRow": 72,
    "sourceCategory": "Warranties & Liability",
    "sourceClauseName": "Exclusivity",
    "textExtract": "",
    "additionalLocations": [
      "No additional locations found for exclusivity provisions in this consumer insurance policy document"
    ],
    "summary": "No exclusivity clause exists in this insurance policy document.",
    "sourceDeviationLevel": "None",
    "actionability": "No action required. This is a consumer insurance policy where exclusivity provisions are not applicable or expected. The absence of exclusivity terms is appropriate for this type of contract, as consumers should retain freedom to engage other insurers. No change is needed."
  },
  {
    "excelRow": 73,
    "sourceCategory": "Warranties & Liability",
    "sourceClauseName": "Parental Company Guarantee",
    "textExtract": "",
    "additionalLocations": [
      "No additional locations found for parental company guarantee provisions in this consumer insurance policy document"
    ],
    "summary": "No parental company guarantee provision exists in this insurance policy document.",
    "sourceDeviationLevel": "None",
    "actionability": "No action required. Parental company guarantees are not standard or appropriate in consumer insurance policies, where the buyer is an individual policyholder purchasing insurance coverage. The insurer's financial stability is regulated by the FCA and PRA, with protections provided through the Financial Services Compensation Scheme (FSCS). This best practice applies to B2B commercial contracts where a buyer procures services from a supplier entity within a corporate group, not to consumer insurance products."
  },
  {
    "excelRow": 74,
    "sourceCategory": "Warranties & Liability",
    "sourceClauseName": "Warranties",
    "textExtract": "DEFINITIONS, Page 10: 'Manufacturer Warranty - Means the period where the manufacturer will resolve any defects in materials and workmanship when your gadget is used normally in accordance with manufactures guidelines for a period as specified by them.' DEFINITIONS, Page 11: 'Taurus Warranty - Means the period where the Claims Administrator will resolve any defects in materials and workmanship when they repair or replace your gadget in the event of a claim, when your gadget is used normally in accordance with manufactures guidelines. For repairs the warranty provided is 3 months and for a replacement the warranty provided is 12 months. This warranty will also include the costs associated with transporting the device to and from our repair centre. The warranty does not cover wear and tear, damage by computer viruses, normal maintenance, accidental damage or any indirect loss.'",
    "additionalLocations": [
      "CONDITIONS AND LIMITATIONS, Page 17, Repair and Replacement Equipment: 'all repairs to gadgets are issued with a 3-month warranty (the gadget must be returned to the Claims Administrator in the event of a claim under that warranty)' and 'All replacement items are issued with a 12-month warranty (the item must be returned to the Claims Administrator in the event of a claim under the warranty)'. WHAT WE WILL NOT COVER, Page 14, General exclusions point 9: 'any breakdown of the device if the fault would not have been covered under the manufacturer's warranty'. WHAT WE WILL COVER, Page 12, Breakdown: 'We will repair or replace your gadget if it suffers breakdown, providing the gadget is returned to us. Please note that this cover only applies if the breakdown occurs outside the manufacturer's warranty period and would have been covered under this.' CONDITIONS AND LIMITATIONS, Page 16, Claims Procedures: 'provide details of any other contract, guarantee, warranty or insurance that may apply to the gadget including, but not limited to, household insurance'"
    ],
    "summary": "Defines manufacturer and Taurus warranty periods covering defects in materials and workmanship under normal use conditions.",
    "sourceDeviationLevel": "High",
    "actionability": "The contract provides only limited post-repair/replacement warranties (3 and 12 months respectively) and excludes critical categories like indirect losses, while breakdown cover is restricted to faults that would have been covered under the manufacturer's warranty. This creates significant gaps in protection for the buyer. Negotiate to extend the Taurus Warranty periods to at least 12 months for repairs and 24 months for replacements. Push to remove or narrow exclusions for wear and tear, and seek coverage for consequential losses up to a reasonable cap. Require the supplier to warrant that all goods and services meet statutory quality standards, are fit for purpose, and comply with all applicable laws and the contract specification. If the supplier resists broader warranties, escalate to Legal to draft comprehensive warranty language covering quality, performance, and compliance obligations that protect the buyer's operational and commercial interests."
  }
] as const satisfies readonly SwitchedOnAnalysisSourceRow[];

export const SWITCHED_ON_TITLE_ALIASES = {
  "Indexation": "Cost Change - Non Index Linked Changes",
  "Pricing and Pricing Model": "Pricing, Pricing Model, and Rate Card Clarity",
  "Ownership of IPR Created by Supplier": "Ownership of IPR Created by the Supplier",
  "Termination for Convenience on Notice": "Termination for Convenience",
} as const;

export const SWITCHED_ON_CATEGORY_ALIASES = {
  "Warranties & Liability": "Warranties and Liability",
} as const;

function normaliseLabel(value: string) {
  return value
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[\u2019']/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

const titleAliasByNormalisedSource = new Map(
  Object.entries(SWITCHED_ON_TITLE_ALIASES).map(([sourceTitle, targetTitle]) => [normaliseLabel(sourceTitle), targetTitle]),
);

const categoryAliasByNormalisedSource = new Map(
  Object.entries(SWITCHED_ON_CATEGORY_ALIASES).map(([sourceCategory, targetCategory]) => [normaliseLabel(sourceCategory), targetCategory]),
);

const frameworkByNormalisedTitle = CLAUSE_FRAMEWORK.reduce((map, clause) => {
  const key = normaliseLabel(clause.title);
  const matches = map.get(key) ?? [];
  matches.push(clause);
  map.set(key, matches);
  return map;
}, new Map<string, ClauseDef[]>());

function targetTitleForRow(row: SwitchedOnAnalysisSourceRow) {
  return titleAliasByNormalisedSource.get(normaliseLabel(row.sourceClauseName)) ?? row.sourceClauseName;
}

function targetCategoryForRow(row: SwitchedOnAnalysisSourceRow) {
  return categoryAliasByNormalisedSource.get(normaliseLabel(row.sourceCategory)) ?? row.sourceCategory;
}

export function resolveSwitchedOnFrameworkClause(row: SwitchedOnAnalysisSourceRow): ClauseDef {
  const targetTitle = targetTitleForRow(row);
  const matches = frameworkByNormalisedTitle.get(normaliseLabel(targetTitle)) ?? [];
  if (matches.length === 1) return matches[0];

  const targetCategory = normaliseLabel(targetCategoryForRow(row));
  const categoryMatch = matches.find((candidate) => normaliseLabel(candidate.category) === targetCategory);
  if (categoryMatch) return categoryMatch;

  throw new Error(`Unable to map Switched On workbook row ${row.excelRow}: ${row.sourceCategory} / ${row.sourceClauseName}`);
}

export function isSwitchedOnMissingClause(row: SwitchedOnAnalysisSourceRow) {
  return row.textExtract.trim().toUpperCase().startsWith("MISS");
}

function severityForSourceLevel(level: SwitchedOnDeviationLevel): ClauseSeverity {
  if (level === "High") return "high";
  if (level === "Medium") return "medium";
  return "low";
}

function clauseScore(clause: ClauseResult) {
  if (clause.resolved) return 1;
  if (clause.sourceDeviationLevel === "None" && clause.missingClause) return 0.45;
  if (clause.severity === "low") return 0.9;
  if (clause.severity === "medium") return 0.6;
  return 0.2;
}

function clauseWeight(category: string) {
  return category === "Commercial Terms" ||
    category === "Commercial Mechanics" ||
    category === "Limitation of Liability and Indemnities"
    ? 2
    : 1;
}

function buildSwitchedOnFirstAnalysisClauses(): ClauseResult[] {
  const seen = new Set<string>();
  const clauses = SWITCHED_ON_ANALYSIS_ROWS.map((row) => {
    const def = resolveSwitchedOnFrameworkClause(row);
    if (seen.has(def.id)) {
      throw new Error(`Duplicate Switched On mapping for ${def.id} from workbook row ${row.excelRow}`);
    }
    seen.add(def.id);

    const missingClause = isSwitchedOnMissingClause(row);
    const resolved = row.sourceDeviationLevel === "None" && !missingClause;
    const change: ClauseChange = missingClause ? "new" : "unchanged";
    const excerpt = row.textExtract || "No source extract recorded in workbook.";

    return {
      id: def.id,
      title: def.title,
      subclause: `\u00a7${def.number}`,
      category: def.category,
      severity: severityForSourceLevel(row.sourceDeviationLevel),
      resolved,
      change,
      missingClause,
      sourceDeviationLevel: row.sourceDeviationLevel,
      deviation: row.summary,
      excerpt,
      locations: row.additionalLocations.length > 0 ? [...row.additionalLocations] : undefined,
      actionability: row.actionability,
    };
  });

  if (clauses.length !== CLAUSE_FRAMEWORK.length || seen.size !== CLAUSE_FRAMEWORK.length) {
    throw new Error(`Switched On workbook mapped ${seen.size} of ${CLAUSE_FRAMEWORK.length} framework clauses`);
  }

  return clauses.sort((a, b) => Number(a.id.slice(1)) - Number(b.id.slice(1)));
}

function summariseSwitchedOnVersion(clauses: ClauseResult[]): Pick<ContractVersion, "highIssues" | "mediumIssues" | "lowIssues" | "overallScore"> {
  const reviewClauses = clauses.filter((clause) => !clause.resolved);
  const highIssues = reviewClauses.filter((clause) => clause.severity === "high").length;
  const mediumIssues = reviewClauses.filter((clause) => clause.severity === "medium").length;
  const lowIssues = reviewClauses.filter((clause) => clause.severity === "low" && !(clause.missingClause && clause.sourceDeviationLevel === "None")).length;

  let achieved = 0;
  let possible = 0;
  for (const clause of clauses) {
    const weight = clauseWeight(clause.category);
    achieved += clauseScore(clause) * weight;
    possible += weight;
  }

  return {
    highIssues,
    mediumIssues,
    lowIssues,
    overallScore: possible > 0 ? Math.round((achieved / possible) * 100) : 0,
  };
}

const switchedOnFirstAnalysisClauses = buildSwitchedOnFirstAnalysisClauses();

export const SWITCHED_ON_FIRST_ANALYSIS_VERSION: ContractVersion = {
  version: "v1",
  uploadedAt: "2023-09-01",
  clauses: switchedOnFirstAnalysisClauses,
  ...summariseSwitchedOnVersion(switchedOnFirstAnalysisClauses),
};
