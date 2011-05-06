const MULTIPLE_CHOICE = 0;
const CHECK_BOXES_WITH_FREE_ENTRY = 1;
const SCALE = 2;
const FREE_ENTRY = 3;
const CHECK_BOXES = 4;
const MULTIPLE_CHOICE_WITH_FREE_ENTRY = 5;

function likertQuestion(text) {
  return { question: text,
      type: SCALE,
      scale_minimum: 1,
      scale_maximum: 5,
      min_label: "Strongly Disagree",
      max_label: "Strongly Agree"};
}

exports.surveyInfo = {
  surveyId: "early_adopter_survey",
  surveyName: "Technology Adoption Survey",
  summary: "This short survey is a supplement to the Technology Adoption Study. ",
  surveyExplanation: "<p>Thank you for completing this 10 question survey! Your response will help " +
    "us understand the technology adoption of our new users and lead to a better Firefox!</p>",
  thumbnail: "https://testpilot.mozillalabs.com/testcases/pilot-survey-thumbnail.png",
  minTPVersion: "1.1",
  versionNumber: 1,
  uploadWithExperiment: "early_adopter_study",
  surveyQuestions:  [
    likertQuestion("I am the first person amongst my friends to try out new desktop or mobile apps "
                   +"(e.g., dropbox, twitter, pandora, skype, web browsers)."),
    likertQuestion("Day-to-day, I use fewer desktop or mobile apps than my friends."),
    likertQuestion("It's really important to me to have the latest mobile or desktop apps."),
    likertQuestion("I am the first person among my friends to hear about new mobile or desktop apps."),
    likertQuestion("If I like a desktop or mobile app, I tell my friends to try it out."),
    likertQuestion("If I have a strong opinion about a mobile or desktop app, I will write a review "
                   +"about it (e.g. Amazon, or App Store)."),
    likertQuestion("I recommend mobile or desktop apps to my friends more often than they recommend "
                   +"technology to me."),
    likertQuestion("If I recommend technology to my friends, they will try it out."),
  { question: "Would you consider yourself to be an early adopter of web technologies?",
    type:  MULTIPLE_CHOICE,
    choices: ["Yes", "No"]},
  { question: "What's your highest education level?",
    type:  MULTIPLE_CHOICE,
    choices: ["High school graduate or less",
      "Undergrad",
      "Master",
      "Phd or above",
      "rather not say"]},
  {question: "How old are you?",
    type: MULTIPLE_CHOICE,
    choices: [
      "Under 18",
      "18 - 25",
      "26 - 35",
      "36 - 45",
      "46 - 55",
      "Older than 55",
      "rather not say"]}
  ]
};
