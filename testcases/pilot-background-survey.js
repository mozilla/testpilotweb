const MULTIPLE_CHOICE = 0;
const CHECK_BOXES_WITH_FREE_ENTRY = 1;
const SCALE = 2;
const FREE_ENTRY = 3;
const CHECK_BOXES = 4;

exports.surveyInfo = {
  surveyId: "basic_panel_survey",
  surveyName: "Pilot Background Survey",
  summary: "This survey aims to help understand who Test Pilots are, and what "
    + "we need to do in order to build a community representative of Firefox "
    + "users and Web users.",
  thumbnail: "",
  surveyExplanation: "<p>Thank you for joining the Test Pilot team!</p> \
<p>Please help us understand our Test Pilot community better by filling out \
this survey. This survey doesn't contain any personally identifiable questions.\
It will be uploaded along with any Test Pilot study data that you choose to \
  submit. You can always use the button below to review or change your answers.</p>",
  thumbnail: "https://testpilot.mozillalabs.com/testcases/pilot-survey-thumbnail.png",
  minTPVersion: "0.4",
  surveyQuestions:  [
   { question: "How long have you used Firefox?",
     type: MULTIPLE_CHOICE,
     choices: ["less than a year", "1-2 years", "2-4 years",
               "more than 4 years", "don't remember"] },
  { question: "Do you use multiple browsers at the same time in daily life?",
    type: MULTIPLE_CHOICE,
    choices: ["No. I only use Firefox.",
              "Yes, I use other browsers besides Firefox."]},
   { question: "If you use other browsers besides Firefox, what are they?",
     type: CHECK_BOXES_WITH_FREE_ENTRY,
     choices: ["Chrome","Safari","Opera","IE 8","IE 7","IE6"],
     free_entry: "Other" },
  { question: "If you use multiple browsers, what's your primary browser?",
    type: MULTIPLE_CHOICE,
    choices: ["I don't user other browsers, only use Firefox"," Firefox as the primary browser","Chrome as the primary browser","Safari as the primary browser","Opera as the primary browser","IE 8 as the primary browser","IE 7 as the primary browser","IE 6 as the primary browser"],
    free_entry: "Other:" },
  { question: "Your gender?",
    type: MULTIPLE_CHOICE,
    choices: ["Male", "Female"]},
  {question: "How old are you?",
   type: MULTIPLE_CHOICE,
   choices: ["under 18",
             "18-25",
             "26-35",
             "36-45",
             "46-55",
             "older than 55"]},
  { question: "How much time do you spend on the Web per day?",
    type: MULTIPLE_CHOICE,
    choices: ["Less than 1 hour",
              "1-2 hours",
              "2-4 hours",
              "4-6 hours",
              "6-8 hours",
              "8-10 hours",
              "More than 10 hours"]},
  { question: "How would you describe your computer/web skill level?",
    type: SCALE,
    scale_minimum: 1,
    scale_maximum: 10,
    min_label: "Super low",
    max_label: "Super high"},
  { question: "Where do you mainly use this computer?",
    type: CHECK_BOXES_WITH_FREE_ENTRY,
    choices: ["Home", "Work", "School"],
    free_entry: "Other" },
   { question: "What are your main purposes for using the Web?",
     type: CHECK_BOXES_WITH_FREE_ENTRY,
     choices: ["Work: programming, coding, etc.",
	       "Work: documentation, presentation, etc.",
	       "Communication: email, IM, etc.",
	       "Socializing: Facebook, Twitter, MySpace. etc",
	       "Entertainment: Video, music, online TV, etc.",
	       "Information retrieval: e.g. search",
	       "Information consuming: news, blogs,etc.",
	       "Information generation and sharing: blogs, photo, video.etc.",
	       "Assisting my life: calendar, online booking, online finance. etc."],
    free_entry: "Other" },
  {question:"How would you describe yourself as a web user?",
   type: FREE_ENTRY}
  ]
};
