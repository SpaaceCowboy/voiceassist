import 'dotenv/config';
import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID!;
const authToken = process.env.TWILIO_AUTH_TOKEN!;
const twilioNumber = process.env.TWILIO_PHONE_NUMBER!;
const callerNumber = '+18188541585';

const client = twilio(accountSid, authToken);

const PAUSE = 15; // seconds between scripted lines

type Scenario = {
  name: string;
  description: string;
  from: string;
  lines: string[];
};

const scenarios: Record<string, Scenario> = {
  reschedule: {
    name: 'Reschedule Appointment',
    description: 'Known patient reschedules an existing appointment',
    from: callerNumber,
    lines: [
      'I would like to reschedule my appointment please.',
      'The in home consultation with Doctor Kamran Parsa.',
      'Can we move it to next Wednesday at 2 PM?',
      'Yes, that works. Please confirm.',
      'Thank you, goodbye.',
    ],
  },

  book: {
    name: 'Book New Appointment',
    description: 'Known patient books a brand new appointment',
    from: callerNumber,
    lines: [
      'Hi, I need to schedule an appointment.',
      'I would like to see Doctor Kamran Parsa.',
      'Next Friday at 10 AM would be great.',
      'At the Palmdale location.',
      'Yes please, book it.',
      'Thank you so much, bye.',
    ],
  },

  cancel: {
    name: 'Cancel Appointment',
    description: 'Known patient cancels an existing appointment',
    from: callerNumber,
    lines: [
      'I need to cancel my appointment.',
      'Yes, the upcoming one.',
      'I just cannot make it.',
      'Yes, please cancel it.',
      'Thank you, goodbye.',
    ],
  },

  faq: {
    name: 'FAQ Questions',
    description: 'Caller asks general questions about the clinic',
    from: callerNumber,
    lines: [
      'What are your office hours?',
      'Where is your Palmdale location?',
      'Do you accept Blue Cross Blue Shield insurance?',
      'What services do you offer?',
      'Okay, thank you. That is all I needed.',
    ],
  },

  transfer: {
    name: 'Transfer to Staff',
    description: 'Caller asks to speak with a real person',
    from: callerNumber,
    lines: [
      'I have a complicated insurance question.',
      'I really need to speak with a real person.',
      'Yes, please transfer me.',
    ],
  },

  quickhangup: {
    name: 'Quick Hangup',
    description: 'Tests post-hangup guard — caller hangs up during greeting',
    from: callerNumber,
    lines: [
      // Hang up before the greeting finishes playing
    ],
  },

  ambiguous: {
    name: 'Ambiguous / Short Responses',
    description: 'Tests how Claude handles vague, single-word inputs',
    from: callerNumber,
    lines: [
      'Appointment.',
      'Um, I think next week maybe.',
      'I do not know. What do you suggest?',
      'Sure.',
      'Okay bye.',
    ],
  },

  multiintent: {
    name: 'Multi-Intent Conversation',
    description: 'Caller changes topic mid-conversation (reschedule then FAQ)',
    from: callerNumber,
    lines: [
      'I want to check on my upcoming appointments.',
      'Actually, can you tell me your office hours first?',
      'Okay. Now about my appointment, can I reschedule it?',
      'How about next Thursday at 3 PM?',
      'Yes, confirm that please.',
      'Thanks, bye.',
    ],
  },
};

function buildTwiml(scenario: Scenario): string {
  if (scenario.lines.length === 0) {
    // Quick hangup: just wait a few seconds then disconnect
    return `<Response><Pause length="4"/><Hangup/></Response>`;
  }

  const parts = scenario.lines.map((line) =>
    `  <Say voice="Polly.Matthew" language="en-US">${escapeXml(line)}</Say>\n  <Pause length="${PAUSE}"/>`
  );

  return `<Response>\n  <Pause length="${PAUSE}"/>\n${parts.join('\n')}\n  <Hangup/>\n</Response>`;
}

function escapeXml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runScenario(key: string): Promise<void> {
  const scenario = scenarios[key];
  if (!scenario) {
    console.error(`Unknown scenario: ${key}`);
    console.error('Available:', Object.keys(scenarios).join(', '));
    process.exit(1);
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log(`Scenario: ${scenario.name}`);
  console.log(scenario.description);
  console.log(`Lines: ${scenario.lines.length}`);
  console.log(`Estimated duration: ~${scenario.lines.length * PAUSE + 20}s`);
  console.log('='.repeat(60));

  if (scenario.lines.length > 0) {
    console.log('\nScript:');
    scenario.lines.forEach((line, i) => console.log(`  ${i + 1}. "${line}"`));
  }

  console.log(`\nCalling ${twilioNumber} from ${scenario.from}...`);

  const call = await client.calls.create({
    to: twilioNumber,
    from: scenario.from,
    twiml: buildTwiml(scenario),
  });

  console.log(`Call SID: ${call.sid}`);
  console.log('Status: queued\n');

  return new Promise((resolve) => {
    const poll = setInterval(async () => {
      try {
        const updated = await client.calls(call.sid).fetch();
        const elapsed = Math.round(
          (Date.now() - new Date(updated.dateCreated.toString()).getTime()) / 1000,
        );
        process.stdout.write(`\r  [${elapsed}s] ${updated.status}    `);

        if (['completed', 'failed', 'busy', 'no-answer', 'canceled'].includes(updated.status)) {
          clearInterval(poll);
          console.log(`\n\nResult: ${updated.status}, duration: ${updated.duration}s`);
          resolve();
        }
      } catch {
        // ignore poll errors
      }
    }, 5000);
  });
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args[0] === '--help') {
    console.log('Usage: npx tsx scripts/test-call.ts <scenario> [scenario2 ...]');
    console.log('       npx tsx scripts/test-call.ts --all\n');
    console.log('Scenarios:');
    for (const [key, s] of Object.entries(scenarios)) {
      console.log(`  ${key.padEnd(15)} ${s.name} — ${s.description}`);
    }
    process.exit(0);
  }

  const keys = args[0] === '--all'
    ? Object.keys(scenarios)
    : args;

  for (const key of keys) {
    try {
      await runScenario(key);
    } catch (error: any) {
      console.error(`\nFailed (${key}):`, error.message || error);
    }

    // Wait between scenarios so the line isn't busy
    if (keys.indexOf(key) < keys.length - 1) {
      console.log('\nWaiting 10s before next scenario...');
      await sleep(10000);
    }
  }

  console.log('\n\nAll scenarios complete. Check Render logs for details.');
  process.exit(0);
}

main();
