// Survey structure — KLEF Employee Experience & Culture Survey (Bilingual: English + తెలుగు).
// Question/description text is "English\nTelugu"; short options are "English / తెలుగు".
// Bump SEED_VERSION whenever this content changes; the server re-seeds on next start.
export const SEED_VERSION = 'bi-2026-08-21b';

// Types: text | single_choice | dropdown | likert | stars | open

export const INTRO = {
  title: 'Employee Experience & Culture Survey\nఉద్యోగుల అనుభవం & సంస్కృతి సర్వే',
  body:
    'KLEF is conducting this Employee Experience & Culture Survey to understand the experiences and ' +
    'perceptions of its employees across various aspects of the workplace, including leadership, work ' +
    'environment, collaboration, growth opportunities, recognition, and well-being. All responses will be ' +
    'kept strictly confidential and used only for institutional improvement.\n\n' +
    'KLEF తన ఉద్యోగుల అనుభవాలను మరియు వివిధ కార్యాలయ అంశాలపై — నాయకత్వం, పని వాతావరణం, సహకారం, ' +
    'ఎదుగుదల అవకాశాలు, గుర్తింపు మరియు శ్రేయస్సు — వారి అభిప్రాయాలను అర్థం చేసుకోవడానికి ఈ సర్వేను ' +
    'నిర్వహిస్తోంది. అన్ని సమాధానాలు ఖచ్చితంగా గోప్యంగా ఉంచబడతాయి మరియు సంస్థాగత అభివృద్ధి కోసం మాత్రమే ' +
    'ఉపయోగించబడతాయి.',
};

const yesNo = ['Yes / అవును', 'No / కాదు'];
const bl = (en, te) => `${en}\n${te}`; // bilingual two-line helper

export const SECTIONS = [
  {
    code: 'DEMO',
    title: 'About You / మీ గురించి',
    description: bl(
      'A few optional details to help us understand feedback across groups. Your name is optional.',
      'సమూహాలవారీగా అభిప్రాయాలను అర్థం చేసుకోవడానికి కొన్ని ఐచ్ఛిక వివరాలు. మీ పేరు ఐచ్ఛికం.'
    ),
    questions: [
      { text: bl('Name (Optional / Anonymous)', 'పేరు (ఐచ్ఛికం / అజ్ఞాతం)'), type: 'text', required: 0 },
      { text: bl('Gender', 'లింగం'), type: 'single_choice', options: ['Male / పురుషుడు', 'Female / స్త్రీ', 'Others / ఇతరులు'], required: 0 },
      { text: bl('Are you a Person with Disability (PwD) / Divyangjan?', 'మీరు దివ్యాంగులు (PwD) / దివ్యాంగజనులా?'), type: 'single_choice', options: yesNo, required: 0 },
      { text: bl('Category', 'వర్గం'), type: 'dropdown', options: ['Teaching / బోధన', 'Non-Teaching / బోధనేతర', 'Other / ఇతర'], required: 0 },
      {
        text: bl('Department', 'శాఖ'),
        type: 'dropdown',
        options: [
          '--- Academic / అకడమిక్ ---',
          'CS&IT', 'AI&DS', 'IoT', 'BES1', 'BES2', 'BT',
          'Computer Science & Engineering', 'Electronics & Communication Engineering',
          'Electrical & Electronics Engineering', 'Mechanical Engineering', 'Civil Engineering',
          'Physics', 'Chemistry', 'Maths', 'English', 'Value Education Cell (VEC)',
          'CSA', 'Arts', 'Food Technology', 'Agriculture', 'Animation & Gaming',
          'EL&GE', 'MD&IE', 'IRD', 'Basic Sciences & Humanities', 'Management Studies',
          'Commerce', 'Pharmacy', 'Law',
          '--- Non-Academic / నాన్-అకడమిక్ ---',
          'VC Office', 'Pro-VC Office', 'Registrar Office',
          'Dean Skill & Student Progression', 'Dean Academics', 'Dean R&D',
          'Hostels', 'SAC', 'Sports', 'Transport', 'Gardening',
          'Maintenance - General', 'Maintenance - Networking / Technical',
          'Administration', 'Other / ఇతర',
        ],
        required: 0,
      },
      {
        text: bl('Title / Position / Designation', 'హోదా / పదవి / డిజిగ్నేషన్'),
        type: 'dropdown',
        options: [
          'VC', 'Pro-VC', 'Registrar', 'Joint Registrar', 'Deputy Registrar', 'Assistant Registrar',
          'Dean', 'Associate Dean', 'Director', 'Senior Director',
          'Principal', 'Vice Principal', 'Assistant Principal',
          'HoD', 'Deputy HoD', 'Alternate HoD', 'Assistant HoD',
          'Professor', 'Associate Professor', 'Assistant Professor', 'Lecturer',
          'General Manager', 'Manager', 'Deputy Manager', 'Assistant Manager',
          'Lab Technician', 'Administrative Staff', 'Other / ఇతర',
        ],
        required: 0,
      },
      {
        text: bl('Total Experience in years (Overall)', 'మొత్తం అనుభవం (సంవత్సరాలలో)'),
        type: 'dropdown',
        options: ['< 1 year / సంవత్సరం', '1-3 years / సంవత్సరాలు', '3-5 years / సంవత్సరాలు', '5-7 years / సంవత్సరాలు', '7-10 years / సంవత్సరాలు', '10+ years / సంవత్సరాలు'],
        required: 0,
      },
      {
        text: bl('Total years of service at KLEF', 'KLEF లో మొత్తం సేవా సంవత్సరాలు'),
        type: 'dropdown',
        options: ['< 1 year / సంవత్సరం', '1-3 years / సంవత్సరాలు', '3-5 years / సంవత్సరాలు', '5-7 years / సంవత్సరాలు', '7-10 years / సంవత్సరాలు', '10+ years / సంవత్సరాలు'],
        required: 0,
      },
    ],
  },
  {
    code: '1',
    title: 'Credibility / విశ్వసనీయత',
    description: bl('Trust in leadership, communication, competence and integrity.', 'నాయకత్వంపై నమ్మకం, సమాచార మార్పిడి, సామర్థ్యం మరియు నిజాయితీ.'),
    likert: true,
    questions: [
      bl('I feel confident that the college leadership makes decisions in the best interest of employees.', 'కళాశాల నాయకత్వం ఉద్యోగుల ప్రయోజనాల దృష్ట్యా ఉత్తమ నిర్ణయాలు తీసుకుంటుందని నేను నమ్ముతున్నాను.'),
      bl('Management communicates honestly, even when the news is difficult.', 'కష్టమైన విషయాలైనా యాజమాన్యం నిజాయితీగా తెలియజేస్తుంది.'),
      bl('I trust the information shared by the institution.', 'సంస్థ పంచుకునే సమాచారాన్ని నేను విశ్వసిస్తాను.'),
      bl("My supervisor's actions match their words.", 'నా పర్యవేక్షకుని మాటలు మరియు చేతలు ఒకేలా ఉంటాయి.'),
      bl('I believe the leadership is capable of handling challenges effectively.', 'సవాళ్లను సమర్థవంతంగా ఎదుర్కొనే సామర్థ్యం నాయకత్వానికి ఉందని నేను నమ్ముతున్నాను.'),
      bl('I feel comfortable asking my supervisor for clarification without hesitation.', 'ఎటువంటి సంకోచం లేకుండా నా పర్యవేక్షకుని వద్ద స్పష్టత అడగడంలో నేను సౌకర్యంగా ఉంటాను.'),
      bl('I believe management genuinely listens before making important decisions.', 'ముఖ్యమైన నిర్ణయాలు తీసుకునే ముందు యాజమాన్యం నిజంగా వింటుందని నేను నమ్ముతున్నాను.'),
      bl('I have confidence in the future direction of this institution.', 'ఈ సంస్థ భవిష్యత్ దిశపై నాకు నమ్మకం ఉంది.'),
    ],
  },
  {
    code: '2',
    title: 'Respect / గౌరవం',
    description: bl('Psychological safety, care, support and growth.', 'మానసిక భద్రత, శ్రద్ధ, మద్దతు మరియు ఎదుగుదల.'),
    likert: true,
    questions: [
      bl('I feel respected as a person, not just as an employee.', 'కేవలం ఉద్యోగిగా కాకుండా ఒక వ్యక్తిగా నేను గౌరవించబడుతున్నానని భావిస్తాను.'),
      bl('I can express my opinions without worrying about negative consequences.', 'ప్రతికూల పరిణామాల గురించి భయపడకుండా నా అభిప్రాయాలను వ్యక్తం చేయగలను.'),
      bl('When I make a mistake, I am treated fairly rather than blamed.', 'నేను పొరపాటు చేసినప్పుడు నిందించకుండా న్యాయంగా వ్యవహరిస్తారు.'),
      bl('My supervisor genuinely cares about my well-being.', 'నా శ్రేయస్సు గురించి నా పర్యవేక్షకుడు నిజంగా శ్రద్ధ వహిస్తారు.'),
      bl('I feel emotionally supported during stressful periods at work.', 'ఒత్తిడితో కూడిన సమయాల్లో పనిలో నాకు మానసిక మద్దతు లభిస్తుంది.'),
      bl('My contributions are appreciated by my colleagues.', 'నా సహోద్యోగులు నా సహకారాన్ని మెచ్చుకుంటారు.'),
      bl('I believe the institution encourages my personal and professional growth.', 'నా వ్యక్తిగత మరియు వృత్తిపరమైన ఎదుగుదలను సంస్థ ప్రోత్సహిస్తుందని నేను నమ్ముతాను.'),
      bl('I feel comfortable asking for help when I need it.', 'అవసరమైనప్పుడు సహాయం అడగడంలో నేను సౌకర్యంగా ఉంటాను.'),
    ],
  },
  {
    code: '3',
    title: 'Fairness / న్యాయబద్ధత',
    description: bl('Justice, equity, trust and inclusion.', 'న్యాయం, సమానత్వం, నమ్మకం మరియు సమ్మిళితం.'),
    likert: true,
    questions: [
      bl('I believe employees are treated fairly regardless of age, gender, or background.', 'వయస్సు, లింగం లేదా నేపథ్యంతో సంబంధం లేకుండా ఉద్యోగులతో న్యాయంగా వ్యవహరిస్తారని నేను నమ్ముతాను.'),
      bl('Recognition is based on performance rather than favoritism.', 'గుర్తింపు పక్షపాతం కాకుండా పనితీరు ఆధారంగా ఉంటుంది.'),
      bl('I feel that my efforts are valued equally with those of others.', 'ఇతరులతో సమానంగా నా కృషికి విలువ ఇవ్వబడుతుందని భావిస్తాను.'),
      bl('Decisions affecting employees are made impartially.', 'ఉద్యోగులను ప్రభావితం చేసే నిర్ణయాలు నిష్పక్షపాతంగా తీసుకోబడతాయి.'),
      bl('I trust that I would receive fair treatment if I faced a workplace issue.', 'కార్యాలయ సమస్య ఎదురైతే నాకు న్యాయమైన వ్యవహారం లభిస్తుందని నమ్ముతాను.'),
      bl('I feel included in my department regardless of my position.', 'నా పదవితో సంబంధం లేకుండా నా శాఖలో నేను భాగమని భావిస్తాను.'),
      bl('I rarely feel overlooked or ignored because of my role.', 'నా పాత్ర కారణంగా నేను నిర్లక్ష్యానికి గురయ్యానని చాలా అరుదుగా భావిస్తాను.'),
      bl('I believe everyone has an equal opportunity to succeed in this institution.', 'ఈ సంస్థలో విజయం సాధించడానికి అందరికీ సమాన అవకాశం ఉందని నేను నమ్ముతాను.'),
    ],
  },
  {
    code: '4',
    title: 'Pride / గర్వం',
    description: bl('Meaning, motivation and organizational commitment.', 'అర్థవంతత, ప్రేరణ మరియు సంస్థపై నిబద్ధత.'),
    likert: true,
    questions: [
      bl('My work gives me a sense of purpose.', 'నా పని నాకు ఒక లక్ష్య భావనను ఇస్తుంది.'),
      bl('I feel proud to tell others that I work at this institution.', 'ఈ సంస్థలో పనిచేస్తున్నానని ఇతరులకు చెప్పడానికి నేను గర్విస్తాను.'),
      bl('I believe my work makes a meaningful contribution to society.', 'నా పని సమాజానికి అర్థవంతమైన సహకారం అందిస్తుందని నేను నమ్ముతాను.'),
      bl('I feel motivated to do my best every day.', 'ప్రతిరోజూ నా అత్యుత్తమం చేయడానికి నేను ప్రేరణ పొందుతాను.'),
      bl('I feel emotionally connected to this institution.', 'ఈ సంస్థతో నేను మానసికంగా అనుబంధం కలిగి ఉన్నాను.'),
      bl('I celebrate the achievements of my department as if they were my own.', 'నా శాఖ సాధించిన విజయాలను నా స్వంతంగా భావించి సంబరపడతాను.'),
      bl('I feel inspired by the mission and values of this college.', 'ఈ కళాశాల లక్ష్యం మరియు విలువలు నాకు స్ఫూర్తినిస్తాయి.'),
      bl('If given the choice, I would like to continue working here for many years.', 'అవకాశం ఉంటే, చాలా సంవత్సరాలు ఇక్కడ పనిచేయడాన్ని కొనసాగించాలనుకుంటాను.'),
    ],
  },
  {
    code: '5',
    title: 'Camaraderie / స్నేహభావం',
    description: bl('Belongingness, social support and community.', 'చెందిన భావన, సామాజిక మద్దతు మరియు సమాజం.'),
    likert: true,
    questions: [
      bl('I feel that I truly belong in this workplace.', 'ఈ కార్యాలయంలో నేను నిజంగా చెందినవాడినని భావిస్తాను.'),
      bl('My colleagues make me feel accepted and valued.', 'నా సహోద్యోగులు నన్ను అంగీకరించి విలువ ఇస్తారని భావిస్తాను.'),
      bl('I have meaningful relationships with the people I work with.', 'నేను కలిసి పనిచేసేవారితో అర్థవంతమైన సంబంధాలు కలిగి ఉన్నాను.'),
      bl('I feel comfortable being myself at work.', 'పనిలో నేను నాలా ఉండటంలో సౌకర్యంగా ఉంటాను.'),
      bl('People in my department genuinely care about one another.', 'నా శాఖలోని వ్యక్తులు ఒకరిపై ఒకరు నిజంగా శ్రద్ధ వహిస్తారు.'),
      bl('There is a strong sense of teamwork in my workplace.', 'నా కార్యాలయంలో బలమైన బృంద స్ఫూర్తి ఉంది.'),
      bl('I feel emotionally connected to my colleagues.', 'నా సహోద్యోగులతో నేను మానసికంగా అనుబంధం కలిగి ఉన్నాను.'),
      bl('Working here makes me feel part of a supportive community.', 'ఇక్కడ పనిచేయడం నన్ను ఒక సహకార సమాజంలో భాగమని భావించేలా చేస్తుంది.'),
    ],
  },
  {
    code: 'REF',
    title: 'Your Reflections / మీ ఆలోచనలు',
    description: bl('A couple of open questions — share as much as you like.', 'కొన్ని ఓపెన్ ప్రశ్నలు — మీకు నచ్చినంత వివరంగా పంచుకోండి.'),
    questions: [
      { text: bl('What changes would most improve your trust, well-being, or sense of belonging in this workplace?', 'ఈ కార్యాలయంలో మీ నమ్మకం, శ్రేయస్సు లేదా చెందిన భావనను ఏ మార్పులు ఎక్కువగా మెరుగుపరుస్తాయి?'), type: 'open', required: 0 },
      { text: bl('Is there anything about your workplace experience that affects your motivation, mental well-being, or job satisfaction that you would like to share?', 'మీ ప్రేరణ, మానసిక శ్రేయస్సు లేదా ఉద్యోగ సంతృప్తిని ప్రభావితం చేసే మీ కార్యాలయ అనుభవం గురించి మీరు పంచుకోవాలనుకుంటున్న అంశం ఏదైనా ఉందా?'), type: 'open', required: 0 },
    ],
  },
  {
    code: 'SAT',
    title: 'Satisfaction & Outlook / సంతృప్తి & దృక్పథం',
    description: bl('Rate your satisfaction and share your outlook.', 'మీ సంతృప్తిని రేట్ చేయండి మరియు మీ దృక్పథాన్ని పంచుకోండి.'),
    questions: [
      { text: bl('Compensation / Pay', 'వేతనం / జీతం'), type: 'stars', required: 0 },
      { text: bl('Job Security', 'ఉద్యోగ భద్రత'), type: 'stars', required: 0 },
      { text: bl('Appraisal', 'మూల్యాంకనం (అప్రైజల్)'), type: 'stars', required: 0 },
      {
        text: bl('Do you see yourself working at this institution for the next two years or more?', 'రాబోయే రెండు సంవత్సరాలు లేదా అంతకంటే ఎక్కువ కాలం ఈ సంస్థలో పనిచేయడాన్ని మీరు ఊహిస్తున్నారా?'),
        type: 'single_choice',
        options: ['Probably yes / బహుశా అవును', 'Not sure / ఖచ్చితంగా తెలియదు', 'Probably not / బహుశా కాదు'],
        required: 0,
      },
    ],
  },
];
