// Survey structure extracted from the KLEF Employee Experience & Culture Survey document.
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
        options: [
          'Computer Science & Engineering', 'Electronics & Communication Engineering',
          'Electrical & Electronics Engineering', 'Mechanical Engineering', 'Civil Engineering',
          'Information Technology', 'Basic Sciences & Humanities', 'Management Studies',
          'Commerce', 'Pharmacy', 'Law', 'Administration', 'Other',
        ],
        required: 0,
      },
      {
        text: 'Title / Position / Designation',
        type: 'dropdown',
        options: ['Professor', 'Associate Professor', 'Assistant Professor', 'Lecturer', 'Lab Technician', 'Administrative Staff', 'Other'],
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
    code: 'A',
    title: 'Pride & Purpose',
    description: 'How connected and proud you feel about your work and the institution.',
    likert: true,
    questions: [
      'I believe this institution makes a positive impact on students and society',
      "I feel connected to the institution's mission and values",
      'My work gives me a sense of purpose',
      "My work contributes meaningfully to the institution's success",
      'I am proud to work at this institution and represent it',
      'I feel proud of the achievements of my department',
      'I would recommend this institution as a good place to work',
    ],
  },
  {
    code: 'B',
    title: 'Learning & Growth',
    description: 'Opportunities to learn, develop and grow in your role.',
    likert: true,
    questions: [
      'The institution encourages continuous learning',
      'Training programs being offered are relevant to my job role',
      'I am satisfied with professional development opportunities',
      'My job allows me to use my strengths effectively',
      'I receive feedback that helps me improve',
    ],
  },
  {
    code: 'C',
    title: 'Fairness & Inclusion',
    description: 'Fair treatment, recognition and consistent, unbiased policies.',
    likert: true,
    questions: [
      'Ethical behavior is practiced in this institution',
      'Employees are treated fairly regardless of position or background',
      'Recognition is based on performance and contribution',
      'Opportunities for promotions & growth are provided fairly',
      'Institutional policies are applied consistently and without bias',
    ],
  },
  {
    code: 'D',
    title: 'Leadership & Credibility',
    description: 'Trust, vision and support from leadership and your supervisor.',
    likert: true,
    questions: [
      'Senior leadership communicates a clear vision',
      'Leaders communicate decisions in a timely manner',
      'I trust the information shared by leadership',
      'Leaders act consistently with institutional values',
      'I have confidence in the future direction of the institution',
      'I understand how my work contributes to institutional goals',
      'My supervisor communicates expectations clearly',
      'I receive the information I need to perform my work effectively',
      'My supervisor is approachable when I need support',
      'My supervisor supports my professional success',
    ],
  },
  {
    code: 'E',
    title: 'Communication & Collaboration',
    description: 'Teamwork, respect and how well information flows across the institution.',
    likert: true,
    questions: [
      'I feel accepted as part of my team',
      'I am encouraged to suggest new ideas and improvements',
      'My team works well together',
      'Employees treat one another with respect',
      'Colleagues help each other when needed',
      'Institutional updates are communicated clearly',
      'Communication within my department is effective',
      'Communication between departments is effective',
      'Employee feedback is considered in decision-making',
      'Collaboration across departments is encouraged',
    ],
  },
  {
    code: 'F',
    title: 'Respect, Care & Belongingness',
    description: 'Dignity, well-being, balance and belonging at your workplace.',
    likert: true,
    questions: [
      'I am treated with dignity and respect at my workplace',
      'My ideas and opinions are valued',
      'I feel a strong sense of belonging in this institution',
      'I feel safe expressing my views without fear',
      'I feel emotionally supported at work',
      'My workload is reasonable for my role',
      'I am able to maintain a healthy work-life balance',
      'The institution cares about employee well-being',
    ],
  },
  {
    code: 'SAT',
    title: 'Satisfaction & Outlook',
    description: 'Rate your satisfaction and share what matters most to you.',
    questions: [
      { text: 'Compensation / Pay', type: 'stars', required: 0 },
      { text: 'Job Security', type: 'stars', required: 0 },
      { text: 'Appraisal', type: 'stars', required: 0 },
      {
        text: 'Do you see yourself working at this institution for the next two years or more?',
        type: 'single_choice',
        options: ['Yes', 'Probably', 'Not sure', 'No'],
        required: 0,
      },
      { text: 'What do you value most about working in this institution and why?', type: 'open', required: 0 },
      { text: 'What is one change that would make this institution a better workplace for you?', type: 'open', required: 0 },
      { text: 'Overall, how satisfied are you with this institution as a workplace?', type: 'stars', required: 0 },
    ],
  },
];
