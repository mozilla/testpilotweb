const MULTIPLE_CHOICE = 0;
const CHECK_BOXES_WITH_FREE_ENTRY = 1;
const SCALE = 2;
const FREE_ENTRY = 3;
const CHECK_BOXES = 4;

exports.surveyInfo = {
  surveyId: "example_survey",
  surveyName: "Example Survey",
  uploadWithExperiment: 1010,  // the "example experiment"
  thumbnail: "https://testpilot.mozillalabs.com/testcases/pilot-survey-thumbnail.png",
  surveyExplanation: "This is just an example survey, don't take it seriously.",
  versionNumber: 3,
  minTPVersion: "1.0a1",
  surveyQuestions: [
    {question: "Please check the races you play in Starcraft.",
     type: CHECK_BOXES,
     choices: ["Terran",
               "Zerg",
               "Protoss"]},
    {question: "Which killer robots are the scariest?",
     type: MULTIPLE_CHOICE,
     choices: ["Cylons from Battlestar Galactica",
               "The Borg from Star Trek",
               "Daleks from Dr. Who",
               "The Terminator"]},
    {question: "How much do you like chocolate?",
     type: SCALE,
     scale_minimum: 1,
     scale_maximum: 5,
     min_label: "A little",
     max_label: "A lot"},
    {question: "Please describe your first date.",
     type: FREE_ENTRY},
    {question: "What kind of hip-hop do you listen to?",
     type: CHECK_BOXES_WITH_FREE_ENTRY,
     choices: ["Old school", "East coast", "West coast", "Dirty South",
              "Gangsta rap"],
     free_entry: "Other"}
  ]
};