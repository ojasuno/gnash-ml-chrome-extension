// Function to get + decode API key
const getKey = () => {
    return new Promise((resolve, reject) => {
        chrome.storage.local.get(['openai-key'], (result) => {
            if (result['openai-key']) {
                const decodedKey = atob(result['openai-key']);
                resolve(decodedKey);
            }
        });
    });
};

const sendMessage = (content) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const activeTab = tabs[0].id;

        chrome.tabs.sendMessage(
            activeTab,
            { message: 'inject', content },
            (response) => {
                if (response.status === 'failed') {
                    console.log('injection failed.');
                }
            }
        );
    });
};

const generate = async (prompt) => {
    // Get your API key from storage
    const key = await getKey();
    const url = 'https://api.openai.com/v1/completions';

    // Call completions endpoint
    const completionResponse = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type':  'application/json',
            Authorization: `Bearer ${key}`,
        },
        body: JSON.stringify({
            model: 'text-davinci-002',
            prompt: prompt,
            max_tokens: 650,
            temperature: 0.7,
        }),
    });

    // Select the top choice and send back
    const completion = await completionResponse.json();
    return completion.choices.pop();
}

const generateCompletionAction = async (info) => {
    try {
        // Send message with generating text (this will be like a loadin indicator)
        sendMessage('generating...');

        const { selectionText } = info;
        const basePromptPrefix = 
            `
            Write me a song lyrics in the style of Twenty One Pilots with the song title below. Please make sure the song goes viral, has a cyberpunk tone, and is a fun listen.

            Song Title: 
            `;

        // Call GPT-3
        const baseCompletion = await generate(`${basePromptPrefix}${selectionText}`);
        
        // Add your second prompt
        // start
        {/* 
        const secondPrompt = 
        `
        Take the song title and lyrics of the song below and generate an album name.

        Song Title: ${selectionText}

        Song Lyrics: ${baseCompletion.text}

        Album Name:
        `;

        // Call your second prompt
        const secondPromptCompletion = await generate(secondPrompt);
        */}
        // end
        // let's see what we got back

        console.log(baseCompletion.text)
        
        // Send the output when we're all done
        sendMessage(baseCompletion.text);
    } catch (error) {
        console.log(error);

        // Add this here as well to see if we run into any erros!
        sendMessage(error,toString());
    }
};

chrome.contextMenus.create({
    id: 'context-run',
    title: 'Generate song lyrics',
    contexts: ['selection'],
});

chrome.contextMenus.onClicked.addListener(generateCompletionAction);