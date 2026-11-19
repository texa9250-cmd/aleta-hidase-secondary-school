/* Achievement records are managed in Staff area > Page uploads. */
const ACHIEVEMENTS = {

  exam: {
    label: "Academic excellence", title: "Top exam scores", am: "ከፍተኛ የፈተና ውጤቶች",
    labelAm: "የትምህርት ውጤታማነት", titleAm: "ከፍተኛ የፈተና ውጤቶች",
    desc: "Students who achieved outstanding results in national and school examinations.",
    descAm: "በአገር አቀፍና በትምህርት ቤት ፈተናዎች ከፍተኛ ውጤት ያስመዘገቡ ተማሪዎች።",
    subLabel: "Stream", subLabelAm: "የትምህርት ክፍል",
    sort: "score",              // highest first, with rank medals
    outOf: 700,
    items: []
  },

  awards: {
    label: "School recognition", title: "School awards", am: "የትምህርት ቤቱ ሽልማቶች",
    labelAm: "የትምህርት ቤት እውቅና", titleAm: "የትምህርት ቤት ሽልማቶች",
    desc: "Official awards earned by the school for academic achievement, teaching and service.",
    descAm: "በትምህርት ውጤት፣ በማስተማርና በአገልግሎት ለትምህርት ቤቱ የተሰጡ ይፋዊ ሽልማቶች።",
    subLabel: "Awarded by", subLabelAm: "ሽልማቱን የሰጠው",
    sort: "year",
    items: []
  },

  competitions: {
    label: "Student talent", title: "Competition wins", am: "የውድድር ድሎች",
    labelAm: "የተማሪ ተሰጥኦ", titleAm: "የውድድር ድሎች",
    desc: "Standout performances in science fairs, debates, quizzes, arts and other competitions.",
    descAm: "በሳይንስ አውደ ርዕዮች፣ ክርክር፣ ጥያቄና መልስ፣ ጥበባትና ሌሎች ውድድሮች የታዩ አስደናቂ ብቃቶች።",
    subLabel: "Competition", subLabelAm: "ውድድር",
    sort: "year",
    items: []
  },

  community: {
    label: "Community leadership", title: "Making a difference", am: "ለውጥ የሚያመጡ ተግባራት",
    labelAm: "የማህበረሰብ አመራር", titleAm: "ለውጥ የሚያመጡ ተግባራት",
    desc: "Student-led service projects that make our community stronger.",
    descAm: "ማህበረሰባችንን የሚያጠናክሩ በተማሪዎች የሚመሩ የአገልግሎት ፕሮጀክቶች።",
    subLabel: "Impact", subLabelAm: "ተጽዕኖ",
    sort: "year",
    items: []
  }
};
