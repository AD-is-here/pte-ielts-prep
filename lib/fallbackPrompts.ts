// Fallback database of high-quality PTE & IELTS prep materials
// Used when Gemini API key is missing, rate-limited, or offline.

export const FALLBACK_SPEAKING = {
  PTE: {
    'read-aloud': [
      "Photography is a beautiful medium of expression. It allows us to capture fleeting moments in time and turn them into permanent records of memory. However, the rise of digital editing software has created debate over the authenticity of modern photojournalism.",
      "The invention of the printing press was a pivotal moment in human history. It democratized access to information, allowing literature to spread rapidly across continents. This sparked scientific revolutions and laid the foundation for the modern intellectual age.",
      "Climate change remains the defining ecological challenge of our generation. Rising atmospheric temperatures are causing glaciers to melt and ocean currents to shift. Governments must coordinate globally to implement sustainable energy infrastructures.",
      "Artificial intelligence is rapidly transforming the global job market. Automation has replaced many routine administrative roles while simultaneously creating demand for highly specialized software developers. Finding a balance in job transition remains a critical policy challenge.",
      "Marine biology is the scientific study of organisms in the ocean or other marine bodies of water. Since in biology many phyla, families and genera have some species that live in the sea, marine biology classifies species based on the environment rather than taxonomy.",
      "Universities are not only centers for academic learning but also crucibles for social development. Students learn to interact with peers from diverse cultural backgrounds, fostering tolerance and empathy. This holistic environment shapes them into responsible global citizens.",
      "The architectural design of sustainable buildings focuses on maximizing natural lighting and passive ventilation. By reducing reliance on artificial heating and cooling systems, these structures drastically minimize energy consumption and carbon footprints over their life cycle.",
      "A telescope is an optical instrument designed to make distant objects appear much closer. It contains an arrangement of lenses or curved mirrors by which rays of light are collected and focused, allowing us to examine stars and galaxies in spectacular detail.",
      "Deep ocean trenches are among the most hostile environments on Earth, characterized by extreme pressure and near-zero temperatures. Yet, diverse specialized communities of organisms thrive near hydrothermal vents, utilizing chemosynthesis instead of sunlight.",
      "The study of macroeconomics focuses on the performance, structure, and behavior of an economy as a whole. Analysts inspect broad indicators such as gross domestic product, unemployment rates, and inflation indexes to draft national monetary policies."
    ],
    'repeat-sentence': [
      "The library will remain closed on Sunday due to scheduled building maintenance.",
      "Please submit your final chemistry laboratory reports before Friday afternoon.",
      "Successful entrepreneurs need to adapt quickly to changing consumer demands.",
      "All undergraduate students must attend the introductory orientation seminar tomorrow morning.",
      "A formal written proposal is required before starting your honors thesis research.",
      "Please ensure all reference citations follow the guidelines in the syllabus.",
      "The lecture on historical linguistics has been rescheduled to next Wednesday.",
      "You can access the online learning management system using your student login credentials.",
      "The chemistry department is hosting a guest speaker from the national research lab.",
      "Your final grade will be calculated based on coursework and class participation."
    ]
  },
  IELTS: {
    'cue-card': [
      {
        topic: "Describe a public park or garden you enjoy visiting.",
        bulletPoints: [
          "Where this park or garden is located",
          "What you can see and do there",
          "How often you visit it",
          "And explain why you enjoy visiting this park or garden."
        ]
      },
      {
        topic: "Describe a piece of technology that you find extremely useful in your daily life.",
        bulletPoints: [
          "What the technology is",
          "How long you have been using it",
          "What main tasks you perform with it",
          "And explain why you find it so essential to your routine."
        ]
      },
      {
        topic: "Describe a book you read recently that you found interesting.",
        bulletPoints: [
          "What the book was and who wrote it",
          "What the book was about",
          "Why you decided to read it",
          "And explain why you found the book so fascinating."
        ]
      },
      {
        topic: "Describe a memorable journey or trip you took.",
        bulletPoints: [
          "Where you went and how you traveled",
          "Who went on the journey with you",
          "What you did during the trip",
          "And explain why this journey was particularly memorable."
        ]
      },
      {
        topic: "Describe a person who has had a significant influence on your life.",
        bulletPoints: [
          "Who this person is and your relationship with them",
          "What qualities make this person special",
          "What they taught you or helped you achieve",
          "And explain how they influenced your perspective."
        ]
      },
      {
        topic: "Describe an environment-friendly habit you have adopted.",
        bulletPoints: [
          "What the habit is and when you started it",
          "How easy or difficult it is to maintain",
          "How it helps protect the environment",
          "And explain how you feel about keeping up this habit."
        ]
      },
      {
        topic: "Describe a historical building or site you have visited.",
        bulletPoints: [
          "Where the building or site is located",
          "What it looks like and its historical background",
          "Why you visited this place",
          "And explain what you found most impressive about it."
        ]
      },
      {
        topic: "Describe a goal you hope to achieve in the near future.",
        bulletPoints: [
          "What the goal is",
          "When you hope to achieve it",
          "What steps you need to take to succeed",
          "And explain why this goal is important to you."
        ]
      },
      {
        topic: "Describe a skill you would like to learn or improve.",
        bulletPoints: [
          "What the skill is and why it interests you",
          "How you plan to learn or practice it",
          "What resources you would need",
          "And explain how this skill will benefit you."
        ]
      },
      {
        topic: "Describe a traditional festival celebrated in your country.",
        bulletPoints: [
          "What the festival is and when it takes place",
          "What custom activities people do during this festival",
          "What traditional foods are prepared",
          "And explain why this festival is culturally significant."
        ]
      }
    ]
  }
};

export const FALLBACK_WRITING = {
  PTE: [
    {
      title: "Workplace Skills vs. General Knowledge",
      prompt: "Some people believe that universities should focus on providing graduates with practical knowledge and skills needed for the workplace. Others argue that the true purpose of a university education should be to acquire knowledge for its own sake, regardless of career utility. Discuss both views and give your own opinion.",
      minWords: 200,
      maxWords: 300,
      timeMinutes: 20
    },
    {
      title: "Environmental Tax Responsibility",
      prompt: "Should large companies be forced to pay an environmental tax because of the pollution they produce, or should governments provide financial incentives to companies that implement eco-friendly operations? Discuss both sides and present your views.",
      minWords: 200,
      maxWords: 300,
      timeMinutes: 20
    },
    {
      title: "Impact of Social Media on Relationships",
      prompt: "Social media networks have changed the way people communicate and build relationships. Some argue it connects people globally, while others believe it reduces face-to-face social skills. Discuss both sides and state your position.",
      minWords: 200,
      maxWords: 300,
      timeMinutes: 20
    },
    {
      title: "Influence of Video Games on Youth",
      prompt: "Many young people spend hours daily playing interactive video games. Some researchers claim it improves cognitive skills, while others link it to physical laziness and aggression. Discuss both arguments and give your opinion.",
      minWords: 200,
      maxWords: 300,
      timeMinutes: 20
    },
    {
      title: "Urban Architecture and Historic Preservation",
      prompt: "Modern cities are rapidly growing, and old, historical buildings are often demolished to make way for new apartments. Is it more important to preserve old buildings or build modern structures? Discuss both points of view.",
      minWords: 200,
      maxWords: 300,
      timeMinutes: 20
    }
  ],
  IELTS: [
    {
      title: "Impact of Advertising on Society",
      prompt: "Today, the high volume of advertisements has a major influence on our lives. Some people argue that advertising is useful for consumers because it introduces new products, while others believe it creates artificial needs and causes financial strain. Discuss both views and give your opinion. Write at least 250 words.",
      minWords: 250,
      maxWords: 500,
      timeMinutes: 40
    },
    {
      title: "Urbanization & Traffic Congestion",
      prompt: "As cities grow, traffic congestion becomes a severe issue. Some governments suggest that building more roads is the best solution, while others argue that improving public transport infrastructures is a more sustainable approach. Discuss both views and give your opinion. Write at least 250 words.",
      minWords: 250,
      maxWords: 500,
      timeMinutes: 40
    },
    {
      title: "Global Tourism and Local Culture",
      prompt: "International tourism has become a major industry worldwide. Some believe it brings economic benefits and cultural understanding, while others argue it leads to the destruction of local traditions and ecosystems. Discuss both views and give your opinion. Write at least 250 words.",
      minWords: 250,
      maxWords: 500,
      timeMinutes: 40
    },
    {
      title: "Distance Learning vs. Traditional Classrooms",
      prompt: "With the rise of online learning systems, many students complete degrees from home. While some think this offers flexibility, others argue traditional classrooms are essential for social and intellectual growth. Discuss both views and give your opinion.",
      minWords: 250,
      maxWords: 500,
      timeMinutes: 40
    },
    {
      title: "Working from Home Post-Pandemic",
      prompt: "Many companies have transitioned to permanent work-from-home models. Discuss the advantages and disadvantages of this trend for employers and employees. Give reasons for your answer and include relevant examples.",
      minWords: 250,
      maxWords: 500,
      timeMinutes: 40
    }
  ]
};

export const FALLBACK_READING = {
  PTE: [
    {
      title: "The Physics of Rain",
      text: "Rain is liquid water in the form of droplets that have [1] from atmospheric water vapor and then become heavy enough to fall under gravity. Rain is a major component of the water cycle and is [2] for depositing most of the fresh water on the Earth. It provides [3] conditions for many types of ecosystems, as well as water for hydroelectric power plants and crop irrigation.",
      blanks: {
        1: { correct: "condensed", options: ["condensed", "evaporated", "frozen", "dissolved"] },
        2: { correct: "responsible", options: ["responsible", "accused", "damaging", "unnecessary"] },
        3: { correct: "suitable", options: ["suitable", "hostile", "barren", "extreme"] }
      }
    },
    {
      title: "Evolution of Libraries",
      text: "Modern libraries have [1] far beyond housing print books. In the digital era, they serve as community hubs offering [2] to digital databases, community workshops, and advanced computing resources. Rather than becoming obsolete, libraries have successfully [3] their roles to meet contemporary educational needs.",
      blanks: {
        1: { correct: "evolved", options: ["evolved", "declined", "retreated", "vanished"] },
        2: { correct: "access", options: ["access", "barriers", "limitation", "denial"] },
        3: { correct: "adapted", options: ["adapted", "resigned", "ignored", "refused"] }
      }
    },
    {
      title: "The Importance of Soil",
      text: "Healthy soil is the [1] of global food production. It provides essential nutrients to plants, filters water, and acts as a major carbon sink that helps regulate global temperatures. However, intensive farming methods have [2] soil health worldwide, making sustainable agricultural management [3] for food security.",
      blanks: {
        1: { correct: "foundation", options: ["foundation", "obstacle", "byproduct", "hindrance"] },
        2: { correct: "degraded", options: ["degraded", "fertilized", "enhanced", "secured"] },
        3: { correct: "critical", options: ["critical", "optional", "irrelevant", "minor"] }
      }
    },
    {
      title: "Biodiversity and Ecosystems",
      text: "Ecosystems rely on a delicate [1] of diverse organisms to function. Each species, no matter how small, plays a unique [2] in maintaining structural stability. The rapid extinction of plant and animal species threatens to [3] these webs, leading to ecosystem collapse.",
      blanks: {
        1: { correct: "balance", options: ["balance", "imbalance", "chaos", "disorder"] },
        2: { correct: "role", options: ["role", "obstruction", "interruption", "excess"] },
        3: { correct: "disrupt", options: ["disrupt", "strengthen", "support", "stabilize"] }
      }
    },
    {
      title: "History of Currency",
      text: "Before modern paper money existed, ancient communities [1] goods through the barter system. Over time, metals like gold and silver became [2] standards because they were durable and scarce. Eventually, governments began printing paper banknotes backed by these precious metal reserves, [3] trade transactions.",
      blanks: {
        1: { correct: "exchanged", options: ["exchanged", "manufactured", "discarded", "borrowed"] },
        2: { correct: "accepted", options: ["accepted", "rejected", "prohibited", "abandoned"] },
        3: { correct: "facilitating", options: ["facilitating", "hindering", "preventing", "complicating"] }
      }
    }
  ],
  IELTS: [
    {
      title: "Rise of Renewable Energy",
      passage: "Renewable energy technologies are clean sources of energy that have a much lower environmental impact than conventional energy technologies. Over the past decade, solar panels and wind turbines have experienced unprecedented cost declines. These cost reductions have been driven by government subsidies, manufacturing scaling, and incremental engineering refinements. While fossil fuels still dominate global power generation, the grid share of wind and solar is climbing exponentially. However, grid integration remains a technical hurdle due to the intermittent nature of solar and wind generation, requiring advanced storage batteries or grid modernization.",
      questions: [
        {
          id: 1,
          q: "What has been the primary driver of cost declines in solar panels and wind turbines over the past decade?",
          options: [
            "Increased reliance on coal and natural gas.",
            "Government subsidies, scaling, and engineering refinements.",
            "A global decline in electricity consumption.",
            "The rising cost of lithium-ion batteries."
          ],
          correctIdx: 1
        },
        {
          id: 2,
          q: "What is the main technical hurdle currently facing wind and solar grid integration?",
          options: [
            "High maintenance costs of turbines.",
            "The intermittent nature of generation.",
            "Lack of interest from private investors.",
            "Lack of clean energy standards."
          ],
          correctIdx: 1
        }
      ]
    },
    {
      title: "The Intelligence of Corvids",
      passage: "Corvids, a family of birds that includes crows, ravens, and jays, are among the most intellectually capable animals on Earth. Field studies have demonstrated their remarkable ability to manufacture and use tools, solve multi-step puzzles, and even plan for future events. In laboratory experiments, crows have shown causal reasoning abilities comparable to a young human child. They can identify individual human faces and pass this warning information to subsequent generations. This capacity for social learning, paired with a large brain-to-body mass ratio, makes corvids a primary subject for evolutionary intelligence research.",
      questions: [
        {
          id: 1,
          q: "Crows have shown causal reasoning abilities in experiments that are comparable to:",
          options: [
            "A young human child.",
            "Other bird families.",
            "Domesticated pets.",
            "Adult primates."
          ],
          correctIdx: 0
        },
        {
          id: 2,
          q: "What features make corvids a key subject for evolutionary intelligence research?",
          options: [
            "Their migration paths and nested habits.",
            "Large brain-to-body ratio and social learning capacity.",
            "Their predatory behavior and speed.",
            "Their ability to mimic human speech sounds."
          ],
          correctIdx: 1
        }
      ]
    },
    {
      title: "Deciphering Ancient Scripts",
      passage: "For centuries, the hieroglyphic carvings of ancient Egypt remained an indecipherable enigma to historians. The breakthrough came in 1799 with the discovery of the Rosetta Stone, a dark granodiorite slab inscribed with a decree written in three scripts: Greek, Demotic, and Hieroglyphic. Since Greek was widely understood, scholars like Jean-François Champollion used it as a bilingual key. By comparing royal names like Ptolemy and Cleopatra across the scripts, Champollion realized hieroglyphs represented both phonetic sounds and symbolic ideas. This discovery unlocked thousands of years of recorded Egyptian history.",
      questions: [
        {
          id: 1,
          q: "What artifact served as the essential key to deciphering Egyptian hieroglyphs?",
          options: [
            "The Rosetta Stone.",
            "The Tomb of Tutankhamun.",
            "The Great Sphinx of Giza.",
            "Ancient papyrus medical scrolls."
          ],
          correctIdx: 0
        },
        {
          id: 2,
          q: "Jean-François Champollion's major realization was that hieroglyphs were:",
          options: [
            "Purely decorative designs.",
            "Used exclusively by ancient priests.",
            "Both phonetic sounds and symbolic ideas.",
            "Exactly identical to ancient Greek."
          ],
          correctIdx: 2
        }
      ]
    }
  ]
};

export const FALLBACK_VOCABULARY = [
  {
    word: "corroborate",
    definition: "Confirm or give support to a statement, theory, or finding.",
    synonyms: ["confirm", "verify", "validate", "substantiate"],
    example: "The witness was able to corroborate the suspect's alibi.",
    level: "C1"
  },
  {
    word: "ambivalent",
    definition: "Having mixed feelings or contradictory ideas about something.",
    synonyms: ["uncertain", "undecided", "conflicted", "equivocal"],
    example: "She was ambivalent about her new job offer, as it paid more but required long hours.",
    level: "B2"
  },
  {
    word: "plethora",
    definition: "A large or excessive amount of something.",
    synonyms: ["abundance", "excess", "surplus", "profusion"],
    example: "The library offers a plethora of resources for research students.",
    level: "C1"
  },
  {
    word: "pragmatic",
    definition: "Dealing with things sensibly and realistically in a practical way.",
    synonyms: ["practical", "realistic", "sensible", "down-to-earth"],
    example: "A pragmatic approach to the problem is needed rather than ideological debates.",
    level: "B2"
  },
  {
    word: "capricious",
    definition: "Given to sudden and unaccountable changes of mood or behavior.",
    synonyms: ["fickle", "inconstant", "unpredictable", "volatile"],
    example: "The administration of dictatorial rulers is often capricious and unjust.",
    level: "C2"
  },
  {
    word: "ubiquitous",
    definition: "Present, appearing, or found everywhere.",
    synonyms: ["omnipresent", "pervasive", "everywhere", "widespread"],
    example: "Mobile phones have become ubiquitous in modern society.",
    level: "C1"
  },
  {
    word: "ephemeral",
    definition: "Lasting for a very short time; transient or fleeting.",
    synonyms: ["transient", "fleeting", "short-lived", "evanescent"],
    example: "The beauty of autumn leaves is ephemeral, lasting only a few weeks.",
    level: "C1"
  },
  {
    word: "dichotomy",
    definition: "A division or contrast between two things that are or are represented as being opposed or entirely different.",
    synonyms: ["division", "contrast", "difference", "polarization"],
    example: "There is a rigid dichotomy between public and private education sectors in this country.",
    level: "C2"
  },
  {
    word: "anomaly",
    definition: "Something that deviates from what is standard, normal, or expected.",
    synonyms: ["oddity", "irregularity", "abnormality", "deviation"],
    example: "A temperature of thirty degrees in mid-winter is an ecological anomaly.",
    level: "B2"
  },
  {
    word: "cogent",
    definition: "Clear, logical, and convincing in an argument or case.",
    synonyms: ["compelling", "persuasive", "convincing", "logical"],
    example: "The defense attorney presented a cogent argument that convinced the jury.",
    level: "C1"
  },
  {
    word: "aesthetic",
    definition: "Concerned with beauty or the appreciation of beauty.",
    synonyms: ["artistic", "visual", "tasteful", "gorgeous"],
    example: "The architects designed the office building with a clean, minimalist aesthetic.",
    level: "B2"
  },
  {
    word: "adversary",
    definition: "One's opponent in a contest, conflict, or dispute.",
    synonyms: ["opponent", "rival", "enemy", "competitor"],
    example: "He defeated his old academic adversary in the debate on economic reform.",
    level: "B2"
  },
  {
    word: "foster",
    definition: "Encourage or promote the development of something, typically something good.",
    synonyms: ["encourage", "promote", "cultivate", "nurture"],
    example: "The university aims to foster a creative environment for research students.",
    level: "B2"
  },
  {
    word: "mitigate",
    definition: "Make less severe, serious, or painful.",
    synonyms: ["alleviate", "reduce", "diminish", "lessen"],
    example: "Drainage improvements were made to mitigate the risk of seasonal flooding.",
    level: "C1"
  },
  {
    word: "obsolete",
    definition: "No longer produced or used; out of date.",
    synonyms: ["outdated", "antique", "archaic", "superseded"],
    example: "Floppy disks became obsolete with the introduction of USB flash drives.",
    level: "B2"
  },
  {
    word: "profound",
    definition: "Very great or intense; having or showing great knowledge or insight.",
    synonyms: ["deep", "intense", "significant", "insightful"],
    example: "The discovery of DNA structure had a profound impact on biological sciences.",
    level: "B2"
  },
  {
    word: "scrutinize",
    definition: "Examine or inspect closely and thoroughly.",
    synonyms: ["examine", "inspect", "analyze", "study"],
    example: "Auditors will scrutinize the financial records to look for irregularities.",
    level: "C1"
  },
  {
    word: "substantiate",
    definition: "Provide evidence to support or prove the truth of.",
    synonyms: ["prove", "support", "validate", "corroborate"],
    example: "You must provide citations to substantiate the claims made in your thesis.",
    level: "C1"
  },
  {
    word: "superfluous",
    definition: "Unnecessary, especially through being more than enough.",
    synonyms: ["redundant", "excess", "unneeded", "extra"],
    example: "Avoid including superfluous details that distract from your main argument.",
    level: "C2"
  },
  {
    word: "transient",
    definition: "Lasting only for a short time; impermanent.",
    synonyms: ["ephemeral", "fleeting", "temporary", "brief"],
    example: "The region has a transient population of fruit pickers who move every season.",
    level: "C1"
  },
  {
    word: "venerable",
    definition: "Accorded a great deal of respect, especially because of age, wisdom, or character.",
    synonyms: ["respected", "honored", "revered", "distinguished"],
    example: "The venerable professor retired after forty years of dedicated teaching.",
    level: "C2"
  },
  {
    word: "wary",
    definition: "Feeling or showing caution about possible dangers or problems.",
    synonyms: ["cautious", "careful", "circumspect", "alert"],
    example: "Investors are wary of funding early-stage startups without audited records.",
    level: "B2"
  },
  {
    word: "adversity",
    definition: "Difficulties or misfortune.",
    synonyms: ["hardship", "difficulty", "misfortune", "distress"],
    example: "She showed great resilience in overcoming adversity during her childhood.",
    level: "B2"
  },
  {
    word: "benevolent",
    definition: "Well meaning and kindly.",
    synonyms: ["kind", "generous", "charitable", "compassionate"],
    example: "A benevolent donor funded the construction of the new campus library.",
    level: "C1"
  },
  {
    word: "diligent",
    definition: "Having or showing care and conscientiousness in one's work or duties.",
    synonyms: ["hardworking", "industrious", "assiduous", "conscientious"],
    example: "Through diligent study, she managed to achieve a perfect IELTS band score.",
    level: "B2"
  },
  {
    word: "empathy",
    definition: "The ability to understand and share the feelings of another.",
    synonyms: ["understanding", "compassion", "sympathy", "sensitivity"],
    example: "Nurses need to show genuine empathy when interacting with critical patients.",
    level: "B2"
  },
  {
    word: "fortitude",
    definition: "Courage in pain or adversity.",
    synonyms: ["bravery", "courage", "resilience", "resolve"],
    example: "She faced her long clinical treatments with great spiritual fortitude.",
    level: "C2"
  },
  {
    word: "hackneyed",
    definition: "Lacking significance through having been overused; unoriginal and trite.",
    synonyms: ["cliché", "trite", "overused", "banal"],
    example: "The speaker relied on hackneyed phrases that bored the student audience.",
    level: "C2"
  },
  {
    word: "inevitable",
    definition: "Certain to happen; unavoidable.",
    synonyms: ["unavoidable", "inescapable", "certain", "fated"],
    example: "As urbanization increases, traffic congestion in major cities is inevitable.",
    level: "B2"
  },
  {
    word: "jubilant",
    definition: "Feeling or expressing great happiness and triumph.",
    synonyms: ["joyful", "ecstatic", "triumphant", "thrilled"],
    example: "The research team was jubilant after their thesis paper was accepted.",
    level: "C1"
  }
];
