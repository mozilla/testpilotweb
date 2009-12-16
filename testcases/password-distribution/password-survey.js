const MULTIPLE_CHOICE = 0;
const CHECK_BOXES_WITH_FREE_ENTRY = 1;
const SCALE = 2;
const FREE_ENTRY = 3;
const CHECK_BOXES = 4;

exports.surveyInfo = {
  surveyId: "account_password_survey",
  surveyName: "Managing Accounts and Passwords - Survey",
  uploadWithExperiment: 3,
  surveyQuestions: [
    {question: "Do you share your computer with others?",
     type: MULTIPLE_CHOICE,
     choices: ["Yes, and we have different accounts.",
               "Yes, we use the same account.",
               "No. I don't share my computer with others."]},
    {question: "Do you ever use multiple accounts for the same website?",
     type: MULTIPLE_CHOICE,
     choices: ["Yes, often", "Sometimes", "Never", "N/A"]},
     {question: "Do you ever forget your user name for a website?",
     type: MULTIPLE_CHOICE,
     choices: ["Yes, often", "Sometimes", "Never", "N/A"]},
     {question: "Do you ever forget your password for a website?",
     type: MULTIPLE_CHOICE,
     choices: ["Yes, often", "Sometimes", "Never", "N/A"]},
     {question: "Do you ever forget BOTH your username and password?",
     type: MULTIPLE_CHOICE,
     choices: ["Yes, often", "Sometimes", "Never", "N/A"]},
     {question: "Do you use Firefox to save your account and password?",
     type: MULTIPLE_CHOICE,
     choices: ["Yes, often", "Sometimes", "Never", "N/A"]},
    {question: "Do you use other tools to help manage your password?",
     type: CHECK_BOXES_WITH_FREE_ENTRY,
     choices: ["No, I memorize them all.",
               "Yes, I write them down on paper.",
               "Yes, I use the Firefox password manager."],
     free_entry: "Yes, I use another piece of software for that:"},
    {question: "Do you use OpenID?",
     type: CHECK_BOXES_WITH_FREE_ENTRY,
     choices: ["Yes, I use an OpenID and like it.",
               "Yes, but I don't like it.",
               "No, but I want one.",
               "No, I don't know what OpenID is."],
     free_entry: "Other"},
    {question: "How do you feel about your current options for managing\
     accounts and passwords?",
     type: SCALE,
     scale_minimum: 1,
     scale_maximum: 5,
     min_label: "Very frustrated",
     max_label: "Very happy"}
  ]
};