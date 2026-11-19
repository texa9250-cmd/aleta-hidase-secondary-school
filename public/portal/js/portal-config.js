/* Subjects of the two streams. Edit these lists to match the subjects your students sit. */
const STREAMS = {
  natural: {name: "Natural Science", am: "የተፈጥሮ ሳይንስ", subjects: ["Mathematics","Physics","Chemistry","Biology","English","Aptitude","Civics"]},
  social:  {name: "Social Science",  am: "የማኅበራዊ ሳይንስ", subjects: ["Mathematics","Geography","History","Economics","English","Aptitude","Civics"]}
};
const SUBJECT_AM = {Mathematics:"ሒሳብ", Physics:"ፊዚክስ", Chemistry:"ኬሚስትሪ", Biology:"ባዮሎጂ", English:"እንግሊዝኛ", Aptitude:"አፕቲትዩድ",
                    Geography:"ጂኦግራፊ", History:"ታሪክ", Economics:"ኢኮኖሚክስ", Civics:"ሥነ ዜጋ"};
const RES_TYPES = ["Past exam","Textbook","Practice","Video","Reference","Notes"];

/* Shown when the school server part is not running (the server keeps its own editable copy). */
const STARTER_SOURCES = [
  {
    "title": "Natural Science entrance exam, 2017 E.C. (2024/2025)",
    "desc": "Past national entrance exam (EUEE) papers for the Natural Science stream. Opens an external website.",
    "subject": "All subjects",
    "stream": "natural",
    "type": "Past exam",
    "year": "2017 E.C",
    "url": "https://kehulum.com/entrance-exam/natural-science/2017"
  },
  {
    "title": "Natural Science entrance exam, 2016 E.C. (2023/2024)",
    "desc": "Past national entrance exam (EUEE) papers for the Natural Science stream. Opens an external website.",
    "subject": "All subjects",
    "stream": "natural",
    "type": "Past exam",
    "year": "2016 E.C",
    "url": "https://kehulum.com/entrance-exam/natural-science/2016"
  },
  {
    "title": "Natural Science entrance exam, 2015 E.C. (2022/2023)",
    "desc": "Past national entrance exam (EUEE) papers for the Natural Science stream. Opens an external website.",
    "subject": "All subjects",
    "stream": "natural",
    "type": "Past exam",
    "year": "2015 E.C",
    "url": "https://kehulum.com/entrance-exam/natural-science/2015"
  },
  {
    "title": "Natural Science entrance exam, 2014 E.C. (2021/2022)",
    "desc": "Past national entrance exam (EUEE) papers for the Natural Science stream. Opens an external website.",
    "subject": "All subjects",
    "stream": "natural",
    "type": "Past exam",
    "year": "2014 E.C",
    "url": "https://kehulum.com/entrance-exam/natural-science/2014"
  },
  {
    "title": "Natural Science entrance exam, 2013 E.C. (2020/2021)",
    "desc": "Past national entrance exam (EUEE) papers for the Natural Science stream. Opens an external website.",
    "subject": "All subjects",
    "stream": "natural",
    "type": "Past exam",
    "year": "2013 E.C",
    "url": "https://kehulum.com/entrance-exam/natural-science/2013"
  },
  {
    "title": "Social Science entrance exam, 2018 E.C. (2025/2026)",
    "desc": "Past national entrance exam (EUEE) papers for the Social Science stream. Opens an external website.",
    "subject": "All subjects",
    "stream": "social",
    "type": "Past exam",
    "year": "2018 E.C",
    "url": "https://kehulum.com/entrance-exam/social-science/2018"
  },
  {
    "title": "Social Science entrance exam, 2017 E.C. (2024/2025)",
    "desc": "Past national entrance exam (EUEE) papers for the Social Science stream. Opens an external website.",
    "subject": "All subjects",
    "stream": "social",
    "type": "Past exam",
    "year": "2017 E.C",
    "url": "https://kehulum.com/entrance-exam/social-science/2017"
  },
  {
    "title": "Social Science entrance exam, 2016 E.C. (2023/2024)",
    "desc": "Past national entrance exam (EUEE) papers for the Social Science stream. Opens an external website.",
    "subject": "All subjects",
    "stream": "social",
    "type": "Past exam",
    "year": "2016 E.C",
    "url": "https://kehulum.com/entrance-exam/social-science/2016"
  },
  {
    "title": "Social Science entrance exam, 2015 E.C. (2022/2023)",
    "desc": "Past national entrance exam (EUEE) papers for the Social Science stream. Opens an external website.",
    "subject": "All subjects",
    "stream": "social",
    "type": "Past exam",
    "year": "2015 E.C",
    "url": "https://kehulum.com/entrance-exam/social-science/2015"
  },
  {
    "title": "Social Science entrance exam, 2014 E.C. (2021/2022)",
    "desc": "Past national entrance exam (EUEE) papers for the Social Science stream. Opens an external website.",
    "subject": "All subjects",
    "stream": "social",
    "type": "Past exam",
    "year": "2014 E.C",
    "url": "https://kehulum.com/entrance-exam/social-science/2014"
  },
  {
    "title": "Social Science entrance exam, 2013 E.C. (2020/2021)",
    "desc": "Past national entrance exam (EUEE) papers for the Social Science stream. Opens an external website.",
    "subject": "All subjects",
    "stream": "social",
    "type": "Past exam",
    "year": "2013 E.C",
    "url": "https://kehulum.com/entrance-exam/social-science/2013"
  },
  {
    "title": "Grade 12 entrance model exams",
    "desc": "Practice exams from different schools to prepare for the entrance exam. Opens an external website.",
    "subject": "All subjects",
    "stream": "both",
    "type": "Practice",
    "year": "",
    "url": "https://kehulum.com/ethio-exam/entrance-model-exams"
  },
  {
    "title": "Grade 12 national exam information (Ministry of Education)",
    "desc": "Official exam schedules, model exam dates and instructions for the Grade 12 national exam.",
    "subject": "All subjects",
    "stream": "both",
    "type": "Reference",
    "year": "",
    "url": "https://examinfo.moe.gov.et/"
  },
  {
    "title": "Grade 12 textbooks, new and old curriculum",
    "desc": "Student textbooks and teacher's guides to download. Opens an external website.",
    "subject": "All subjects",
    "stream": "both",
    "type": "Textbook",
    "year": "",
    "url": "https://kehulum.com/textbook/grade-12"
  }
];
