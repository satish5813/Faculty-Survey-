// Survey structure — KLEF Employee Experience & Culture Survey (5-domain GPTW model).
// Types:
//   text          - short free-text (optional name)
//   single_choice - radio buttons (options[])
//   dropdown      - select (options[])
//   likert        - 1..5 agreement scale
//   stars         - 1..5 star rating
//   open          - long free text (textarea)

export const INTRO = {
  title: 'Employee Experience & Culture Survey',
  body:
    'KLEF is conducting this Employee Experience & Culture Survey to understand the ' +
    'experiences and perceptions of its employees across various aspects of the workplace, ' +
    'including leadership, work environment, collaboration, growth opportunities, recognition, ' +
    'and well-being. The feedback collected will help management identify strengths and areas ' +
    'for improvement and strengthen its journey towards building a more positive, inclusive, ' +
    'and high-performing workplace aligned with Great Place to Work (GPTW) principles. ' +
    'All responses will be kept strictly confidential and used only for institutional improvement.',
};

const yesNo = ['Yes', 'No'];

export const SECTIONS = [
  {
    code: 'DEMO',
    title: 'About You',
    description: 'A few optional details to help us understand feedback across groups. Your name is optional and responses stay confidential.',
    questions: [
      { text: 'Name (Optional / Anonymous)', type: 'text', required: 0 },
      { text: 'Gender', type: 'single_choice', options: ['Male', 'Female', 'Others'], required: 0 },
      { text: 'Are you a Person with Disability (PwD) / Divyangjan?', type: 'single_choice', options: yesNo, required: 0 },
      { text: 'Type of Employment', type: 'dropdown', options: ['Fulltime', 'Parttime', 'Contract', 'Adhoc', 'Other'], required: 0 },
      { text: 'Category', type: 'dropdown', options: ['Teaching', 'Non-Teaching', 'Other'], required: 0 },
      {
        text: 'Department',
        type: 'dropdown',
        // Entries formatted as "--- Label ---" are rendered as non-selectable group headers.
        options: [
          '--- Academic ---',
          'CS&IT', 'AI&DS', 'IoT', 'BES1', 'BES2', 'BT',
          'Computer Science & Engineering', 'Electronics & Communication Engineering',
          'Electrical & Electronics Engineering', 'Mechanical Engineering', 'Civil Engineering',
          'Physics', 'Chemistry', 'Maths', 'English', 'Value Education Cell (VEC)',
          'CSA', 'Arts', 'Food Technology', 'Agriculture', 'Animation & Gaming',
          'EL&GE', 'MD&IE', 'IRD', 'Basic Sciences & Humanities', 'Management Studies',
          'Commerce', 'Pharmacy', 'Law',
          '--- Non-Academic ---',
          'VC Office', 'Pro-VC Office', 'Registrar Office',
          'Dean Skill & Student Progression', 'Dean Academics', 'Dean R&D',
          'Hostels', 'SAC', 'Sports', 'Transport', 'Gardening',
          'Maintenance - General', 'Maintenance - Networking / Technical',
          'Administration', 'Other',
        ],
        required: 0,
      },
      {
        text: 'Title / Position / Designation',
        type: 'dropdown',
        options: [
          'VC', 'Pro-VC', 'Registrar', 'Joint Registrar', 'Deputy Registrar', 'Assistant Registrar',
          'Dean', 'Associate Dean', 'Director', 'Senior Director',
          'Principal', 'Vice Principal', 'Assistant Principal',
          'HoD', 'Deputy HoD', 'Alternate HoD', 'Assistant HoD',
          'Professor', 'Associate Professor', 'Assistant Professor', 'Lecturer',
          'General Manager', 'Manager', 'Deputy Manager', 'Assistant Manager',
          'Lab Technician', 'Administrative Staff', 'Other',
        ],
        required: 0,
      },
      {
        text: 'Total Experience in years (Overall)',
        type: 'dropdown',
        options: ['< 1 year', '1-3 years', '3-5 years', '5-7 years', '7-10 years', '10+ years'],
        required: 0,
      },
      {
        text: 'Total years of service at KLEF',
        type: 'dropdown',
        options: ['< 1 year', '1-3 years', '3-5 years', '5-7 years', '7-10 years', '10+ years'],
        required: 0,
      },
    ],
  },
  {
    code: '1',
    title: 'Credibility',
    description: 'Trust in leadership, communication, competence and integrity.',
    likert: true,
    questions: [
      'I feel confident that the college leadership makes decisions in the best interest of employees.',
      'Management communicates honestly, even when the news is difficult.',
      'I trust the information shared by the institution.',
      "My supervisor's actions match their words.",
      'I believe the leadership is capable of handling challenges effectively.',
      'I feel comfortable asking my supervisor for clarification without hesitation.',
      'I believe management genuinely listens before making important decisions.',
      'I have confidence in the future direction of this institution.',
    ],
  },
  {
    code: '2',
    title: 'Respect',
    description: 'Psychological safety, care, support and growth.',
    likert: true,
    questions: [
      'I feel respected as a person, not just as an employee.',
      'I can express my opinions without worrying about negative consequences.',
      'When I make a mistake, I am treated fairly rather than blamed.',
      'My supervisor genuinely cares about my well-being.',
      'I feel emotionally supported during stressful periods at work.',
      'My contributions are appreciated by my colleagues.',
      'I believe the institution encourages my personal and professional growth.',
      'I feel comfortable asking for help when I need it.',
    ],
  },
  {
    code: '3',
    title: 'Fairness',
    description: 'Justice, equity, trust and inclusion.',
    likert: true,
    questions: [
      'I believe employees are treated fairly regardless of age, gender, or background.',
      'Recognition is based on performance rather than favoritism.',
      'I feel that my efforts are valued equally with those of others.',
      'Decisions affecting employees are made impartially.',
      'I trust that I would receive fair treatment if I faced a workplace issue.',
      'I feel included in my department regardless of my position.',
      'I rarely feel overlooked or ignored because of my role.',
      'I believe everyone has an equal opportunity to succeed in this institution.',
    ],
  },
  {
    code: '4',
    title: 'Pride',
    description: 'Meaning, motivation and organizational commitment.',
    likert: true,
    questions: [
      'My work gives me a sense of purpose.',
      'I feel proud to tell others that I work at this institution.',
      'I believe my work makes a meaningful contribution to society.',
      'I feel motivated to do my best every day.',
      'I feel emotionally connected to this institution.',
      'I celebrate the achievements of my department as if they were my own.',
      'I feel inspired by the mission and values of this college.',
      'If given the choice, I would like to continue working here for many years.',
    ],
  },
  {
    code: '5',
    title: 'Camaraderie',
    description: 'Belongingness, social support and community.',
    likert: true,
    questions: [
      'I feel that I truly belong in this workplace.',
      'My colleagues make me feel accepted and valued.',
      'I have meaningful relationships with the people I work with.',
      'I feel comfortable being myself at work.',
      'People in my department genuinely care about one another.',
      'There is a strong sense of teamwork in my workplace.',
      'I feel emotionally connected to my colleagues.',
      'Working here makes me feel part of a supportive community.',
    ],
  },
  {
    code: 'REF',
    title: 'Your Reflections',
    description: 'A couple of open questions — share as much or as little as you like.',
    questions: [
      {
        text: 'What changes would most improve your trust, well-being, or sense of belonging in this workplace?',
        type: 'open',
        required: 0,
      },
      {
        text: 'Is there anything about your workplace experience that affects your motivation, mental well-being, or job satisfaction that you would like to share?',
        type: 'open',
        required: 0,
      },
    ],
  },
  {
    code: 'SAT',
    title: 'Satisfaction & Outlook',
    description: 'Rate your satisfaction and share your outlook.',
    questions: [
      { text: 'Compensation / Pay', type: 'stars', required: 0 },
      { text: 'Job Security', type: 'stars', required: 0 },
      { text: 'Appraisal', type: 'stars', required: 0 },
      {
        text: 'Do you see yourself working at this institution for the next two years or more?',
        type: 'single_choice',
        options: ['Probably yes', 'Not sure', 'Probably not'],
        required: 0,
      },
    ],
  },
];
