/**
 * Large 5000-sentence medical spa consultation transcript for stress testing
 * This simulates a comprehensive consultation covering all tracker categories
 */

const generateMedSpaTranscript = (): string => {
  const sections = {
    introduction: [
      "Hello, welcome to Radiance Medical Spa, my name is Sarah and I'll be your consultant today.",
      "It's wonderful to meet you, I'm Dr. Martinez and I specialize in aesthetic treatments.",
      "Thank you for choosing our clinic, I'm here to discuss your aesthetic goals today.",
      "Good morning, I'm Jennifer, your aesthetic nurse practitioner for today's consultation.",
      "Welcome to our practice, I've reviewed your intake form and I'm excited to help you.",
      "I appreciate you taking the time to visit us today for this comprehensive consultation.",
      "My role today is to understand your concerns and create a personalized treatment plan.",
      "I want to ensure you feel completely comfortable throughout our discussion today.",
      "Let's start by reviewing what brought you in to see us today."
    ],
    
    rapportBuilding: [
      "How are you feeling about being here today, any nervousness or excitement?",
      "I want you to know that this is a judgment-free space where we can discuss anything.",
      "Your comfort and satisfaction are my absolute top priorities today.",
      "I can see you've put thought into this decision, and I really appreciate that.",
      "Many of my patients initially feel the same way you're describing right now.",
      "I want to make sure you feel heard and understood throughout this process.",
      "It's completely normal to have questions and concerns about aesthetic treatments.",
      "I'm here to support you every step of the way, from consultation to aftercare.",
      "Your journey toward your aesthetic goals should be exciting and empowering."
    ],
    
    listeningToConcerns: [
      "I'm hearing that your main concern is about the fine lines around your eyes.",
      "You mentioned feeling self-conscious about the volume loss in your cheeks.",
      "It sounds like the sun damage on your chest area is really bothering you.",
      "I understand that you're worried about looking unnatural after treatment.",
      "Your concern about downtime is completely valid given your busy schedule.",
      "I can tell that maintaining a natural appearance is very important to you.",
      "You're right to be cautious about the potential side effects of treatments.",
      "I hear your concern about the investment and wanting to see real results.",
      "Your worry about pain during the procedure is something we can definitely address."
    ],
    
    overallAssessment: [
      "Looking at your skin overall, I can see several areas where we can make improvements.",
      "Your bone structure is beautiful, and we can enhance what you already have naturally.",
      "I'm assessing your skin texture, tone, and elasticity to create the best plan.",
      "Your facial anatomy is perfect for the treatments I'm considering recommending.",
      "I can see that your skin has good healing potential based on your medical history.",
      "Overall, you're an excellent candidate for the aesthetic treatments we've discussed.",
      "Your skin type and concerns align well with several treatment options available.",
      "I'm taking into account your lifestyle, budget, and desired outcomes for this assessment.",
      "The combination of treatments I'm considering will address all your main concerns."
    ],
    
    treatmentPlan: [
      "I recommend starting with Botox for the crow's feet and forehead lines.",
      "Dermal fillers would be perfect for restoring volume in your cheek area.",
      "A series of chemical peels will significantly improve your skin texture and tone.",
      "I suggest combining micro-needling with PRP for comprehensive skin rejuvenation.",
      "Laser resurfacing would be ideal for addressing the sun damage you mentioned.",
      "We should schedule your Botox touch-ups every three to four months.",
      "The filler treatment will last approximately twelve to eighteen months.",
      "I recommend spacing your treatments two weeks apart for optimal healing.",
      "We'll start conservatively and build up to your desired results gradually."
    ],
    
    pricingQuestions: [
      "The Botox treatment is priced at $12 per unit, and you'll need about 30 units.",
      "Our dermal filler package starts at $650 per syringe, you'll likely need two syringes.",
      "The chemical peel series is $200 per treatment, with a package of three treatments.",
      "We offer financing options through CareCredit with 0% interest for qualified patients.",
      "The total investment for your comprehensive treatment plan would be around $2,400.",
      "We do offer a 10% discount if you book and pay for multiple treatments today.",
      "Many patients find the results are worth every penny when they see their transformation.",
      "The cost includes all follow-up appointments and touch-ups within the first month.",
      "We can discuss a payment plan that works within your budget and timeline."
    ],
    
    followUpBooking: [
      "I'd like to schedule your first Botox treatment for next week if that works.",
      "We should book your follow-up appointment for two weeks after your initial treatment.",
      "I'll have my scheduler find the best times that work with your availability.",
      "Let's plan your treatment series over the next three months for optimal results.",
      "I want to see you back in two weeks to assess your healing and progress.",
      "We'll schedule your touch-up appointment before you leave today to secure your spot.",
      "I recommend booking your next consultation in six months to evaluate results.",
      "My assistant will coordinate all your appointment times to minimize disruption to your schedule.",
      "Let's get you on our calendar right now while we have these time slots available."
    ]
  };

  // Generate exactly 5000 sentences by repeating and varying the patterns
  const sentences: string[] = [];
  const categories = Object.keys(sections);
  
  // Calculate how many sentences per category (roughly equal distribution)
  const sentencesPerCategory = Math.floor(5000 / categories.length);
  const remainder = 5000 % categories.length;
  
  categories.forEach((category, categoryIndex) => {
    const baseSentences = sections[category as keyof typeof sections];
    const targetCount = sentencesPerCategory + (categoryIndex < remainder ? 1 : 0);
    
    for (let i = 0; i < targetCount; i++) {
      const baseSentence = baseSentences[i % baseSentences.length];
      
      // Add variations to make each sentence unique
      const variations = [
        baseSentence,
        baseSentence.replace("today", "this session"),
        baseSentence.replace("you", "patients like yourself"),
        baseSentence.replace("I", "we"),
        baseSentence.replace("your", "the"),
        `Additionally, ${baseSentence.toLowerCase()}`,
        `Furthermore, ${baseSentence.toLowerCase()}`,
        `In my experience, ${baseSentence.toLowerCase()}`,
        `Most importantly, ${baseSentence.toLowerCase()}`,
        `As you can see, ${baseSentence.toLowerCase()}`
      ];
      
      const variation = variations[i % variations.length];
      sentences.push(variation);
    }
  });
  
  // Shuffle sentences to create more realistic conversation flow
  for (let i = sentences.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [sentences[i], sentences[j]] = [sentences[j], sentences[i]];
  }
  
  return sentences.join(' ');
};

export const LARGE_TEST_TRANSCRIPT = generateMedSpaTranscript();

export const TEST_METADATA = {
  totalSentences: 5000,
  estimatedProcessingTime: "8-12 minutes",
  expectedBatches: Math.ceil(5000 / 25), // 200 batches
  categories: [
    'introduction',
    'rapport-building', 
    'listening-to-concerns',
    'overall-assessment',
    'treatment-plan',
    'pricing-questions',
    'follow-up-booking'
  ]
};

console.log(`📊 Generated test transcript with ${LARGE_TEST_TRANSCRIPT.split(/[.!?]+/).length} sentences`);
console.log(`📈 Expected processing: ${TEST_METADATA.expectedBatches} batches, ${TEST_METADATA.estimatedProcessingTime}`);