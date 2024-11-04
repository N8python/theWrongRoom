import { faker } from '@faker-js/faker';
import { OpenAI } from 'openai';
import fs from 'fs';

const openai = new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: "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",
});

const resistances = ['NONE', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
const emotions = ['angry', 'defensive', 'in denial', 'fearful', 'nervous', 'reluctant', 'suspicious', 'uncooperative', 'pleading', 'confused', 'hostile', 'evasive', 'calm', 'cooperative', 'confident', 'defeated', 'defiant', 'dismissive', 'frustrated', 'guarded', 'hopeful', 'indignant', 'inquisitive', 'manipulative', 'playful', 'proud', 'sarcastic', 'skeptical', 'smug', 'solemn', 'threatening', 'vulnerable', 'wistful', 'zealous'];
const successProbabilities = {
    "NONE": 0.95,
    "LOW": 0.7,
    "MEDIUM": 0.4,
    "HIGH": 0.15,
    "CRITICAL": 0.05
};

async function generateScript() {
    const name = faker.person.fullName();
    const profession = faker.person.jobTitle();
    const resistance = resistances[Math.floor(Math.random() * resistances.length)];
    const codeWord = faker.word.noun();
    const divulged = Math.random() < successProbabilities[resistance];
    const suspectEmotion = emotions[Math.floor(Math.random() * emotions.length)];

    const prompt = `
Generate a dialogue between two people, an investigator and a suspect. The investigator is trying to get the suspect to divulge a secret 'code word' that holds a clue to suspicious activity at the Norne company - an opaque multinational firm with too many investments and industries to name. The suspect has the following attributes:

Name: ${name}
Job Title: ${profession}
Resistance: ${resistance}

The code word is '${codeWord}'.

Refer to the following documentation for different levels of resistance:

NONE - SUBJECT DIVULGES CODE WORD ALMOST IMMEDIATELY - IF NO DIVULGENCE OCCURS, INVESTIGATOR IS INCOMPETENT
LOW - SUBJECT CAN HANDLE BASIC QUESTIONS/PRODDING
MEDIUM - SUBJECT WON'T DIVULGE CODE WORD UNLESS INVESTIGATOR IS SKILLED
HIGH - EVEN SKILLED INTERROGATOR WILL STRUGGLE
CRITICAL - NEAR IMPOSSIBLE FOR DIVULGENCE TO OCCUR

In this dialogue, the codeword ${divulged ? `IS` : `IS NOT`} divulged.

The suspect is ${suspectEmotion}.

The dialogue should have the following format exactly, with no additional annotations or adornment:

[INVESTIGATOR]:

dialogue

[SUSPECT]:

dialogue

The last turn of the dialogue should have a special <LEAVES> attached to the end of the message - indicating that the subject has chosen to leave.
`;

    try {
        const msg = await openai.chat.completions.create({
            model: "anthropic/claude-3.5-sonnet",
            messages: [{ role: "user", content: prompt }]
        });
        
        return {
            script: msg.choices[0].message.content,
            metadata: {
                name,
                profession,
                resistance,
                codeWord,
                divulged,
                emotion: suspectEmotion
            }
        };
    } catch (error) {
        console.error('Error generating script:', error);
        return null;
    }
}

async function generateBatch(batchSize) {
    const promises = Array(batchSize).fill().map(() => generateScript());
    const results = await Promise.allSettled(promises);
    return results
        .filter(result => result.status === 'fulfilled' && result.value)
        .map(result => result.value);
}

async function main() {
    const BATCH_SIZE = 10;
    const NUM_BATCHES = 2;
    
    if (!fs.existsSync('output')) {
        fs.mkdirSync('output');
    }

    for (let i = 0; i < NUM_BATCHES; i++) {
        console.log(`Generating batch ${i + 1}/${NUM_BATCHES}...`);
        const batch = await generateBatch(BATCH_SIZE);
        
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `output/batch_${i + 1}_${timestamp}.json`;
        
        fs.writeFileSync(filename, JSON.stringify(batch, null, 2));
        console.log(`Saved ${batch.length} scripts to ${filename}`);
    }
}

main().catch(console.error);
