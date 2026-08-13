# Prompt Engineering Roadmap

> AI tools are only as good as what you ask them. This is a practical, zero-jargon guide
> to writing prompts that actually work, from your very first one to advanced patterns
> used in production.

**Everything here is free.** No course purchase, no signup walls.

---

## Table of contents

1. [Why this matters](#why-this-matters)
2. [Understand what you are talking to](#step-1-understand-what-you-are-talking-to)
3. [The anatomy of a good prompt](#step-2-the-anatomy-of-a-good-prompt)
4. [The techniques that matter](#step-3-the-techniques-that-matter)
5. [Before and after examples](#step-4-see-the-difference)
6. [Common mistakes](#common-mistakes-to-avoid)
7. [Your 4-step plan](#your-4-step-plan)
8. [Free resources](#free-resources)
9. [Prompt quality checklist](#prompt-quality-checklist)

---

## Why this matters

Two people use the same AI model. One gets vague, generic output. The other gets exactly
what they need, first try. The difference is not the tool, it is how they ask.

This is now a real, paid skill. It appears in job descriptions across engineering, product,
marketing, and support. More importantly, it makes everything else you do faster: writing
code, debugging, research, drafting, learning.

**Vague prompt**
```
write about databases
```
> Result: a generic textbook paragraph you could have googled.

**Clear prompt**
```
Explain the difference between SQL and NoSQL to a final-year CS student
preparing for interviews. Use a real example of when each one is the right
choice. Keep it under 200 words. End with one question an interviewer might ask.
```
> Result: something you can actually use tonight.

Same model. Same cost. Completely different value.

---

## Step 1: Understand what you are talking to

You do not need the maths, but a rough mental model makes you dramatically better at
prompting.

### What an LLM actually does

A large language model predicts the next most likely chunk of text, over and over, based
on everything it has seen so far. That is genuinely it. Everything impressive it does
comes from doing that extremely well at massive scale.

Three consequences you should internalise:

- **It has no memory between chats** unless the tool gives it one. Every conversation
  starts fresh.
- **It can be confidently wrong.** It predicts plausible text, not verified truth. Always
  check facts that matter.
- **Context is everything.** It only knows what is in the conversation right now, plus its
  training. Give it what it needs.

### The vocabulary you will keep hearing

| Term | What it actually means |
|------|------------------------|
| **LLM** | Large Language Model. The engine, for example GPT, Claude, Gemini, Llama. |
| **GPT** | Generative Pre-trained Transformer. OpenAI's family of models. |
| **Token** | A chunk of text, roughly 4 characters. Models read and bill in tokens, not words. |
| **Context window** | How much text the model can hold at once. Go over it and the earliest parts fall away. |
| **Temperature** | Randomness dial. Low (0 to 0.3) for facts and code. Higher (0.7+) for creative work. |
| **System prompt** | Instructions that set the model's role and rules before the conversation starts. |
| **Hallucination** | When the model invents something false but says it confidently. |
| **RAG** | Retrieval Augmented Generation. Feeding the model your own documents so it answers from real sources. |
| **Fine-tuning** | Further training a model on your data. Expensive. Usually good prompting is enough. |
| **Agent** | An LLM given tools and a goal, so it can take actions in a loop, not just reply. |

### Start here (free)

**Understand the basics**
- [What is OpenAI](https://www.aiforanyone.org/glossary/openai) - plain-English explainer
- [GPT models explained and compared](https://www.makeuseof.com/gpt-models-explained-and-compared/)
- [GPT-2 vs GPT-3 vs GPT-3.5 vs GPT-4](https://iq.opengenus.org/gpt2-vs-gpt3-vs-gpt35-vs-gpt4/)

**Official documentation**
- [Microsoft Learn: Prompt engineering](https://learn.microsoft.com/en-us/azure/ai-services/openai/concepts/prompt-engineering)
- [Google Cloud: What is prompt engineering](https://cloud.google.com/discover/what-is-prompt-engineering)
- [OpenAI prompt engineering guide](https://platform.openai.com/docs/guides/prompt-engineering)
- [Anthropic prompt engineering docs](https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/overview)

---

## Step 2: The anatomy of a good prompt

Almost every strong prompt has some combination of these five parts. You will not always
need all five, but knowing them means you always know what to add when the output is not
right.

### 1. Role
Tell it who to be. This shapes vocabulary, depth, and assumptions.
```
You are a senior backend engineer reviewing code for a junior developer.
```

### 2. Task
Say exactly what you want done. Use a clear action verb.
```
Review this function and list the three most serious issues.
```

### 3. Context
Give the background it cannot guess: audience, constraints, what you already tried.
```
This runs in production handling 10k requests a minute. We cannot add dependencies.
```

### 4. Format
Describe the shape of the answer you want. This one saves the most time.
```
Answer as a markdown table with columns: Issue, Severity, Fix.
```

### 5. Constraints
Set the boundaries: length, tone, what to avoid, what to assume.
```
Under 150 words. No code snippets. If you are unsure, say so rather than guessing.
```

### Putting it together

```
You are an experienced technical interviewer at a product company.

I am a final-year CS student preparing for backend interviews.
I understand basic SQL but have never designed a schema from scratch.

Design a database schema for a food delivery app.

Walk me through your thinking step by step, then show the final
tables with columns and relationships.

Keep it to 5 tables maximum. Explain each design decision in one
sentence. End with two follow-up questions an interviewer would
likely ask about this schema.
```

Every one of the five parts is in there: role, context, task, format, constraints. That is
the whole trick.

---

## Step 3: The techniques that matter

Learn the first four properly and you will handle 90% of real situations.

### Beginner

**Zero-shot prompting**
Just ask, with no examples. The default way most people use AI.
*Use when:* the task is common and well understood.

**Few-shot prompting**
Show 2 to 5 examples of input and desired output, then give your real input. The single
highest-leverage technique.
*Use when:* you need a specific format or style. Examples teach far better than descriptions.

```
Classify the sentiment. Examples:

Review: "Arrived broken, waste of money" -> Negative
Review: "Works exactly as described" -> Positive
Review: "It's fine I guess" -> Neutral

Review: "Shipping took forever but the product is great" ->
```

**Chain of thought**
Ask it to reason step by step before answering. Dramatically improves accuracy on logic,
maths, and multi-step problems.
*Use when:* the answer requires reasoning. Add: `Think through this step by step before answering.`

**Role prompting**
Assign an identity and expertise level. Changes vocabulary, depth, and what it assumes you
already know.
*Use when:* you want a specific perspective or level of detail.

### Intermediate

**Output formatting**
Specify the exact structure: JSON, markdown table, bullet list, numbered steps.
*Use when:* you need machine-readable or consistently structured output.

**Prompt chaining**
Break a big task into several prompts, feeding each output into the next. Far more reliable
than one giant prompt.
*Use when:* the task has distinct stages. Research, then outline, then draft, then edit.

**Delimiters**
Wrap different parts in clear markers so the model knows what is instruction and what is data.
*Use when:* passing in text to process.

```
Summarise the text between the triple quotes in one sentence.

"""
[your text here]
"""
```

**Self-critique**
Ask it to review and improve its own answer. Often catches real errors on the second pass.
*Use when:* quality matters. Add: `Now critique your answer and give an improved version.`

### Advanced

**Tree of thought**
Ask it to generate several distinct approaches, evaluate each, then pick and develop the best.
*Use when:* there are genuinely multiple valid strategies and the choice matters.

**RAG (grounding)**
Supply your own documents in the prompt so answers come from real sources instead of memory.
The main cure for hallucination.
*Use when:* you need accuracy on private, recent, or domain-specific information.

**Tool and function calling**
Let the model call real functions: search, database queries, APIs, calculations. The
foundation of AI agents.
*Use when:* the model needs live data or must take actions in the world.

**Evaluation**
Build a small test set of inputs with expected outputs, then measure prompt changes against
it instead of guessing.
*Use when:* a prompt goes into production. This is what separates hobby from professional.

---

## Step 4: See the difference

### Debugging code

**Weak**
```
my code doesn't work, fix it
```
No code, no error, no context. It has to guess everything.

**Strong**
```
This Python function should return unique users sorted by signup date,
but it returns duplicates. Here is the function and the actual output
versus expected output.

Explain the root cause first, then give the corrected code with a
comment on the line that changed.
```

### Learning something new

**Weak**
```
explain kubernetes
```
You get a Wikipedia-style dump at an unknown difficulty level.

**Strong**
```
I know Docker but have never used Kubernetes. Explain Kubernetes by
building on what I already understand about containers. Use one running
analogy throughout. Cover only pods, services, and deployments.

Then give me one small thing I can build this weekend to make it click.
```

### Getting feedback on your work

**Weak**
```
is my resume good?
```
You will get polite, generic praise. Useless.

**Strong**
```
You are a hiring manager at a product company who screens 200 resumes
a week. Here is my resume and the job description I am targeting.

Be blunt. List the three things that would make you reject it in the
first 10 seconds, then the three highest-impact changes. Do not be
encouraging, be useful.
```

Explicitly asking for bluntness is what unlocks honest feedback.

---

## Common mistakes to avoid

| Mistake | Why it hurts |
|---------|--------------|
| **Being polite instead of specific** | "Could you please help me a bit with this?" wastes tokens. Clear and direct beats courteous. |
| **Asking for everything at once** | One giant prompt with six unrelated requests produces six mediocre answers. Chain them. |
| **Trusting output without checking** | Confident tone is not accuracy. Verify anything factual, especially numbers, citations, and APIs. |
| **Giving up after one try** | The first prompt is a draft. Good results usually come from two or three rounds of refining. |
| **Saying what not to do** | "Do not be boring" is weak. "Use concrete examples and short sentences" is what you actually want. |
| **Pasting private data** | Never put passwords, keys, customer data, or confidential work into a public AI tool. |

---

## Your 4-step plan

Go at your own pace. Each step takes a few days of focused practice. By the end you will have a small portfolio of prompts that
solve real problems, which is genuinely worth showing in an interview.

### Step 1: Foundations
- Read the Microsoft Learn and Google Cloud guides
- Learn the vocabulary table until the terms feel obvious
- Practise the five-part structure: role, task, context, format, constraints
- Rewrite 10 lazy prompts you have used before into strong ones

**Deliverable:** a personal cheat sheet of your five best prompt templates

### Step 2: Core techniques
- Practise zero-shot, few-shot, chain of thought, and role prompting
- For each one, solve a real problem from your own work or study
- Learn delimiters and structured output (JSON, markdown tables)
- Try the same task with each technique and compare quality

**Deliverable:** one prompt that reliably produces valid JSON you could feed into code

### Step 3: Build something
- Pick a repetitive task you actually do and automate it with prompt chaining
- Try the OpenAI or Azure OpenAI API from a script, not just the chat window
- Explore [Semantic Kernel](https://learn.microsoft.com/en-us/semantic-kernel/overview/)
  or LangChain to see how prompts work inside applications
- Learn what RAG is and why grounding beats fine-tuning for most cases

**Deliverable:** a small working script or notebook that uses an LLM to do something useful

### Step 4: Go deeper
- Learn function and tool calling, then build a tiny agent
- Create a small evaluation set and measure your prompts objectively
- Read about prompt injection and basic AI safety
- Write up what you built and share it publicly

**Deliverable:** a GitHub repo plus a short post explaining what you learned

---

## Free resources

### Official guides (start here)
- [Microsoft: Prompt engineering techniques](https://learn.microsoft.com/en-us/azure/ai-services/openai/concepts/prompt-engineering)
- [Google Cloud: What is prompt engineering](https://cloud.google.com/discover/what-is-prompt-engineering)
- [OpenAI: Prompt engineering guide](https://platform.openai.com/docs/guides/prompt-engineering)
- [Anthropic: Prompt engineering](https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/overview)

### Free courses
- [DeepLearning.AI: ChatGPT Prompt Engineering](https://learn.deeplearning.ai/courses/chatgpt-prompt-eng)
- [Microsoft Learn: Prompt engineering path](https://learn.microsoft.com/en-us/training/paths/prompt-engineering-with-azure-openai/)
- [Google: Intro to Generative AI](https://www.cloudskillsboost.google/paths/118)
- [Prompt Engineering Guide (open source)](https://www.promptingguide.ai)

### Understand the fundamentals
- [What is OpenAI](https://www.aiforanyone.org/glossary/openai)
- [GPT models explained and compared](https://www.makeuseof.com/gpt-models-explained-and-compared/)
- [GPT version differences](https://iq.opengenus.org/gpt2-vs-gpt3-vs-gpt35-vs-gpt4/)
- [The Illustrated Transformer](https://jalammar.github.io/illustrated-transformer/)

### Build with prompts in code
- [Semantic Kernel overview](https://learn.microsoft.com/en-us/semantic-kernel/overview/)
- [Semantic Kernel: prompt engineering](https://learn.microsoft.com/en-us/semantic-kernel/concepts/prompts/)
- [LangChain tutorials](https://python.langchain.com/docs/tutorials/)
- [Microsoft: Generative AI for Beginners](https://github.com/microsoft/generative-ai-for-beginners)

### Practise for free
- [ChatGPT](https://chat.openai.com) - free tier
- [Claude](https://claude.ai) - free tier
- [Google Gemini](https://gemini.google.com) - free tier
- [Microsoft Copilot](https://copilot.microsoft.com) - free
- [HuggingChat](https://huggingface.co/chat) - open models

### Go deeper
- [DAIR.AI Prompt Engineering Guide](https://github.com/dair-ai/Prompt-Engineering-Guide)
- [Awesome ChatGPT Prompts](https://github.com/f/awesome-chatgpt-prompts)
- [Anthropic research blog](https://www.anthropic.com/news)
- [OpenAI research](https://openai.com/research)

---

## Prompt quality checklist

Not getting what you want? Run through this before rewriting from scratch.

- [ ] Have I said **who** it should be (role and expertise level)?
- [ ] Is the **task** a single clear action, not three tangled ones?
- [ ] Have I given the **context** it cannot possibly guess?
- [ ] Have I described the **format** I want the answer in?
- [ ] Have I set **constraints** on length, tone, and scope?
- [ ] Would **examples** teach this faster than my description?
- [ ] Does this need **step-by-step reasoning** before the answer?
- [ ] Have I said what **to do** rather than only what to avoid?
- [ ] Should I **split this** into a chain of smaller prompts?
- [ ] Am I about to paste anything **private or confidential**?

---

## Ready-to-use prompt templates

### Learn a new concept
```
I already know [X]. Explain [NEW CONCEPT] by building on that.
Use one analogy throughout. Cover only [SPECIFIC SUBTOPICS].
Then give me one small thing I can build to make it click.
```

### Review my code
```
You are a senior [LANGUAGE] engineer doing a code review.

Here is my code and what it should do: [CODE + INTENT]

List issues in order of severity. For each: what is wrong, why it
matters, and the fix. Be direct, skip the compliments.
```

### Get honest feedback
```
You are [RELEVANT EXPERT] who sees hundreds of these a week.

Here is my [WORK]: [PASTE]

Be blunt. What are the three biggest problems, and what are the three
highest-impact changes? Do not be encouraging, be useful.
```

### Structured extraction
```
Extract the following from the text between triple quotes.
Return valid JSON only, no explanation.

Schema:
{ "field1": string, "field2": number, "field3": string[] }

"""
[TEXT]
"""
```

### Interview practice
```
You are interviewing me for a [ROLE] position at a [COMPANY TYPE].

Ask me one question at a time. After each answer, rate it out of 10,
tell me what a strong answer would have included, then ask the next
question. Start with a medium-difficulty question.
```

---

**One last thing.** The people who get the most out of AI are not the ones who memorised
the most techniques. They are the ones who think clearly about what they actually want
before they start typing. Prompting is mostly just that skill, written down.

---

*Part of [Resources by Shumbul Arifa](https://shumbul.github.io/Resources)*
