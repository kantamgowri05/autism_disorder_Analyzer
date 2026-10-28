export const QUESTIONS_DB = {
  toddler: [
    { id: "A1", text: "Does your child look at you when you call their name?", reversed: true },
    { id: "A2", text: "How easy is it for you to get eye contact with your child?", reversed: true },
    { id: "A3", text: "Does your child point to indicate that they want something? (e.g. a toy out of reach)", reversed: true },
    { id: "A4", text: "Does your child point to share interest with you? (e.g. pointing at an interesting sight)", reversed: true },
    { id: "A5", text: "Does your child pretend? (e.g. care for dolls, talk on a toy phone)", reversed: true },
    { id: "A6", text: "Does your child follow where you are looking?", reversed: true },
    { id: "A7", text: "If you or someone in the family is visibly upset, does your child show signs of wanting to comfort them?", reversed: true },
    { id: "A8", text: "Would you describe your child's first words as unusual, delayed, or repetitive?", reversed: false },
    { id: "A9", text: "Does your child use simple communicative gestures? (e.g. wave goodbye)", reversed: true },
    { id: "A10", text: "Does your child stare at nothing with no apparent purpose?", reversed: false }
  ],
  children: [
    { id: "A1_Score", text: "Does the child notice small sounds when others do not notice them?", reversed: false },
    { id: "A2_Score", text: "Does the child usually concentrate more on the whole picture rather than small details?", reversed: true },
    { id: "A3_Score", text: "In a social group, can the child easily keep track of several different people's conversations?", reversed: true },
    { id: "A4_Score", text: "Does the child find it easy to switch smoothly between different activities?", reversed: true },
    { id: "A5_Score", text: "Does the child struggle with knowing how to keep a conversation going with peers?", reversed: false },
    { id: "A6_Score", text: "Is the child comfortable with social chit-chat and spontaneous interaction?", reversed: true },
    { id: "A7_Score", text: "When reading a story, does the child find it difficult to deduce the characters' intentions?", reversed: false },
    { id: "A8_Score", text: "Did the child enjoy imaginative role-play games with peers during early childhood?", reversed: true },
    { id: "A9_Score", text: "Does the child find it easy to work out what someone is feeling just by looking at their face?", reversed: true },
    { id: "A10_Score", text: "Does the child find it difficult or stressful to make new friends?", reversed: false }
  ],
  adolescent: [
    { id: "A1_Score", text: "Do you notice subtle background sounds that others around you do not notice?", reversed: false },
    { id: "A2_Score", text: "Do you focus more on the general overview of a situation rather than individual details?", reversed: true },
    { id: "A3_Score", text: "In a group conversation, can you comfortably keep track of multiple dialogues at once?", reversed: true },
    { id: "A4_Score", text: "Can you smoothly switch tasks and refocus when an interruption occurs?", reversed: true },
    { id: "A5_Score", text: "Do you find it awkward or difficult to keep conversations going with peers?", reversed: false },
    { id: "A6_Score", text: "Are you comfortable initiating and participating in informal social chit-chat?", reversed: true },
    { id: "A7_Score", text: "Do you find it difficult to discern subtle intentions or hidden motives in other people?", reversed: false },
    { id: "A8_Score", text: "Did you enjoy pretend play and creative storytelling games as a child?", reversed: true },
    { id: "A9_Score", text: "Can you easily determine someone's emotional state by observing their facial expressions?", reversed: true },
    { id: "A10_Score", text: "Do you find it challenging or intimidating to build new friendships?", reversed: false }
  ],
  adult: [
    { id: "A1_Score", text: "I often notice subtle sounds when others do not appear to notice them.", reversed: false },
    { id: "A2_Score", text: "I usually concentrate more on the overall picture rather than small component details.", reversed: true },
    { id: "A3_Score", text: "I find it easy to engage in more than one conversational thread simultaneously.", reversed: true },
    { id: "A4_Score", text: "If an unexpected interruption happens, I can return to my original task smoothly.", reversed: true },
    { id: "A5_Score", text: "I find it intuitive to 'read between the lines' when someone is speaking to me.", reversed: true },
    { id: "A6_Score", text: "I know how to tell when someone listening to me is beginning to lose interest.", reversed: true },
    { id: "A7_Score", text: "When reading fiction or watching drama, I find it difficult to intuit characters' underlying motives.", reversed: false },
    { id: "A8_Score", text: "I like to collect detailed information and patterns regarding specific categories of interest.", reversed: false },
    { id: "A9_Score", text: "I find it easy to ascertain what someone is thinking or feeling simply by observing their face.", reversed: true },
    { id: "A10_Score", text: "I find it difficult or exhausting to initiate and sustain new friendships.", reversed: false }
  ]
};

export const RAPID_ITEMS_MAP = {
  toddler: ["A7", "A9", "A5", "A6", "A1"],
  children: ["A4_Score", "A9_Score", "A8_Score", "A10_Score", "A1_Score"],
  adolescent: ["A5_Score", "A10_Score", "A4_Score", "A3_Score", "A6_Score"],
  adult: ["A9_Score", "A6_Score", "A5_Score", "A4_Score", "A3_Score"]
};
