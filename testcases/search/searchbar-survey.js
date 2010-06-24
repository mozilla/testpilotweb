const MULTIPLE_CHOICE = 0;
const CHECK_BOXES_WITH_FREE_ENTRY = 1;
const SCALE = 2;
const FREE_ENTRY = 3;
const CHECK_BOXES = 4;

exports.surveyInfo = {
  surveyId: "searchbar_survey",
  surveyName: "Searchbar",
  summary: "This survey is just a test.",
  thumbnail: "",
  surveyExplanation: "Explanation goes here. This survey is just a test.",
  minTPVersion: "1.0b4",
  versionNumber: 1,
  uploadWithExperiment: 8,
  thumbnail: "https://testpilot.mozillalabs.com/testcases/pilot-survey-thumbnail.png",
  surveyQuestions: [
    {question: "What search engines do you use?",
     type: CHECK_BOXES_WITH_FREE_ENTRY,
     choices: ["Google",
               "Bing",
               "Yahoo"],
     free_entry: "Other"
    }
  ]
};