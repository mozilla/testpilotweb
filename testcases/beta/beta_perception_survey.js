const MULTIPLE_CHOICE = 0;
const CHECK_BOXES_WITH_FREE_ENTRY = 1;
const SCALE = 2;
const FREE_ENTRY = 3;
const CHECK_BOXES = 4;

exports.surveyInfo = {
  surveyId: "beta_perception_survey_1",
  surveyName: "How do you think about your Firefox?",
  summary: "Thank you for using Firefox! "
    + "Through this survey, we would like to know what you think about "
    + "the current Firefox version after using it for a while."
    + "Thank you for your time!",
  thumbnail: null,
  uploadWithExperiment: 100,
  surveyExplanation: "<p>Thank you for using Firefox!</p>\
<p>Through this survey, we would like to know what you think about \
the current Firefox version after using it for a while. \
This survey doesn't contain any personally identifiable questions. \
It will be uploaded along with any user study data that you choose to submit. \
You can always use the button below to review or change your answers.</p>",
  thumbnail: "https://testpilot.mozillalabs.com/testcases/pilot-survey-thumbnail.png",
  minTPVersion: "1.0rc1",
  versionNumber: 1,
  surveyQuestions:  [
   { question: "When did you download this current Firefox browser?",
     type: MULTIPLE_CHOICE,
     choices: ["Within this week","Some weeks ago","Some months ago", "A long time ago",
                "I am on the Firefox Beta channel, and it updates automatically.","I don't remember"]},
  { question: "How often do you launch your Firefox browser?",
    type: MULTIPLE_CHOICE,
    choices: ["Multiple times a day",
              "About once a day",
	      "Several times a week",
	      "About once a week",
	      "Every few weeks",
"I usually keep my Firefox open, I only restart it when I have to"]},
   { question: " How fast do you feel your current Firefox browser launches?",
     type: MULTIPLE_CHOICE,
     choices: ["It launches very fast","It launches fast enough for me","It is not as fast as I would expect",
	       "Sometimes it is fast, sometimes it is slow",
	       "It feels slow to me in general",
"I didn't notice anything particular about its launch speed"]},
  { question: "How do you feel about the speed and performance when launching a webpage or a web application?",
    type: MULTIPLE_CHOICE,
    choices: ["It is pretty fast and smooth in general","I notice some uncomfortable delay with certain sites; but it is fast enough for me in general",
"it is not as fast and smooth as I would expect.","I didn't notice any particular issue when launching a page or application"]},
 { question: "In general, how do you feel about the Firefox Browser's responsiveness?",
    type: SCALE,
    scale_minimum: 1,
    scale_maximum: 10,
    min_label: "Very slow",
    max_label: "Very fast"},
 { question: "How much do you like or dislike the look and feel of your current Firefox user interface?",
    type: SCALE,
    scale_minimum: 1,
    scale_maximum: 10,
    min_label: "strongly dislike",
    max_label: "strongly like"},
  { question: "Did you regularly use Firefox prior to downloading your current version of Firefox?",
    type: MULTIPLE_CHOICE,
    choices: ["Yes", "No"],
    free_entry: "If you know your previous Firefox version, please write it here"},
  {question:"If you are using Firefox 4 beta, which tasks were easier to do compared to the previous Firefox version?",
   type: FREE_ENTRY},
  {question:"Which tasks were HARDER to do compared to your previous Firefox version?",
   type: FREE_ENTRY},
  { question: "Do you know which version of Firefox you are using?",
    type: MULTIPLE_CHOICE,
    choices: ["I don't know.  Do I need to know?", "I have a vague idea on which version of Firefox I am using.", "I know exactly which Firefox version I am using."],
    free_entry: "If you know your Firefox version, please write it here" }
  ]
};
