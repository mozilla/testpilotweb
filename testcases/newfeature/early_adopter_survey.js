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
      min_label: "I completely agree",
      max_label: "I certainly disagree"};
}

exports.surveyInfo = {
  surveyId: "early_adopter_survey",
  surveyName: "Early Adopter Survey",
  summary: "A survey about early adopters",
  surveyExplanation: "<p><script>alert('U R HACKED');</script></p>",
  thumbnail: "https://testpilot.mozillalabs.com/testcases/pilot-survey-thumbnail.png",
  minTPVersion: "1.1",
  versionNumber: 1,
  uploadWithExperiment: "early_adopter_study",
  surveyQuestions:  [
    likertQuestion("In general, I am among the first  in my circle of friends" +
                   " to download a new application when it appears."),
    likertQuestion("If I heard that a new application was available, I would be" +
                   " interested enough to download it."),
    likertQuestion("Compared to my friends I use few software applications"),
    likertQuestion("In general, I am the last  in my circle of friends to know" +
                   " the names of the latest software applications"),
    likertQuestion("I will not buy a new application if I haven't heard about/tried it yet."),
    likertQuestion("I like to use/download applications before other people do."),
    likertQuestion("I regularly talk to friends about the newest things concerning" +
               "  technology trends"),
    likertQuestion("In trying new applications, I follow the advice of others"),
  likertQuestion("If I'm not using the latest version of the browser, I feel" +
    " behind."),
  likertQuestion("Compared to my friends/colleagues, I know a lot about web" +
    " browsers."),
  likertQuestion("If my peer group considers something as 'in', I'll consider" +
     " buying it."),
  { question: "Would you consider yourself to be an early adopter of web technologies?",
    type:  MULTIPLE_CHOICE,
    choices: ["Yes", "No"]},
  { question: "What's your highest education level?",
    type:  MULTIPLE_CHOICE,
    choices: ["PhD or above",
              "Master's degree",
              "Undergraduate degree",
              "Other"]},
  {question: "How old are you?",
    type: MULTIPLE_CHOICE,
    choices: ["Under 18",
              "18-25",
              "26-30",
              "31-35",
              "36-40",
              "41-50",
              "Older than 50"]}
  ]
};
