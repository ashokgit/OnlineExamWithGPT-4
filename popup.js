function showLoading() {
  document.getElementById('loading').style.display = 'block';
}

function hideLoading() {
  document.getElementById('loading').style.display = 'none';
}

document.addEventListener('DOMContentLoaded', function () {
  var getOptionsBtn = document.getElementById('get-options-btn');
  var getCodeBtn = document.getElementById('get-code-btn');
  var submitTextBtn = document.getElementById('submit-text-btn');
  var recordAudioBtn = document.getElementById('record-audio-btn');
  var inputText = document.getElementById('input-text');
  var copyQuestionBtn = document.getElementById('copy-question-btn');
  var copyAnswerBtn = document.getElementById('copy-answer-btn');
  const modelSelect = document.getElementById('model-select');

  copyQuestionBtn.addEventListener('click', function () {
    const questionText = document.getElementById('question-area').innerText;
    copyToClipboard(questionText);
  });
  
  copyAnswerBtn.addEventListener('click', function () {
    const answerText = document.getElementById('answer-area').innerText;
    copyToClipboard(answerText);
  });

  getOptionsBtn.addEventListener('click', function () {
    // Send a message to content.js requesting the document body
    chrome.runtime.sendMessage({ action: 'getDocumentBody' }, function (response) {
      // Handle the response from content.js
      const model = modelSelect.value;
      getOptions(stripTags(response), model).then((res) => {
        const optionsHtml = `<pre>${res}</pre>`;
        document.getElementById('answer-area').innerHTML = optionsHtml;
      });
    });
  });

  getCodeBtn.addEventListener('click', function () {
    // Send a message to content.js requesting the document body
    chrome.runtime.sendMessage({ action: 'getDocumentBody' }, function (response) {
      // Handle the response from content.js
      const model = modelSelect.value;
      getCode(stripTags(response), model).then((res) => {
        const codeHtml = `<pre>${res}</pre>`;
        document.getElementById('answer-area').innerHTML = codeHtml;
      });
    });
  });

  submitTextBtn.addEventListener('click', function () {
    // Process the input text and get the answer
    var text = inputText.value;
    const model = modelSelect.value;
    getAnswer(stripTags(text), model).then((res) => {
      const answerHtml = `<pre>${res}</pre>`;
      document.getElementById('answer-area').innerHTML = answerHtml;
    });
  });

  recordAudioBtn.addEventListener('click', async function () {
    chrome.runtime.sendMessage({ action: 'recordAudio' }, async function (response) {
      const audioBlob = response.audioBlob;
      await sendAudioToOpenAI(audioBlob);
    });
  });

  async function sendAudioToOpenAI(audioBlob) {
  const formData = new FormData();
  formData.append('file', audioBlob, 'openai.mp3');
  formData.append('model', 'whisper-1');

  const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
    body: formData,
  });

  const result = await response.json();
  // Fill the text area with the transcribed text
  inputText.value = result.text;
  }
});
// Remaining functions for getting question, options, code, and answer

function getQuestion(prompt, model, type) {
  apiKey = 'your-open-ai-api-key';
  const endpointUrl = 'https://api.openai.com/v1/chat/completions';
  console.log(prompt, model);
  const promptType = type; //'GetCode'; // Replace this with the desired type: GetPromptAnswer, GetCode, or GetOptions
  const promptContent = getPromptByType(promptType);
  const data = {
    model: model,
    messages: [
      {
        role: "system",
        content: prompt + "\n "+promptContent,
      },
    ],
  };

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey}`,
  };
  showLoading();
  return fetch(endpointUrl, {
    method: "POST",
    headers: headers,
    body: JSON.stringify(data),
  })
    .then((response) => response.json())
    .then((result) => {
      const question = result.choices[0].message.content.trim();
      const codeHtml = `<pre>${question}</pre>`;
      document.getElementById('question-area').innerHTML = codeHtml
      return question;
    })
    .catch((error) => {
      console.error(error);
      hideLoading();
    });
}

function getOptions(prompt, model) {
  // Your logic for getting options using OpenAI API
  return getQuestion(prompt, model,'GetOptions').then((question) => {
    const endpointUrl = 'https://api.openai.com/v1/completions';

    const data = {
      model: 'code-davinci-002',
      prompt: `###\n${question}\nList the options and the correct answer:`,
      max_tokens: 400,
      temperature: 0.7,
      stop: ['###'],
    };

    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    };
    showLoading();
    return fetch(endpointUrl, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(data),
    })
      .then((response) => response.json())
      .then((result) => {
        const options = result.choices[0].text.trim();
        hideLoading();
        return options;
      })
      .catch((error) => {
        console.error(error);
        hideLoading();
      });
  });
}

function getCode(prompt, model) {
  // Your logic for getting code using OpenAI API
  return getQuestion(prompt, model, 'GetCode').then((question) => {
    const endpointUrl = 'https://api.openai.com/v1/completions';

    const data = {
      model: 'code-davinci-002',
      prompt: `###\n${question}\nProvide the code to solve the problem:`,
      max_tokens: 400,
      temperature: 0.7,
      stop: ['###'],
    };

    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    };
    showLoading();
    return fetch(endpointUrl, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(data),
    })
      .then((response) => response.json())
      .then((result) => {
        const code = result.choices[0].text.trim();
        hideLoading();
        return code;
      })
      .catch((error) => {
        console.error(error);
        hideLoading();
      });
  });
}

  function getAnswer(prompt, model) {
    apiKey = 'your-open-ai-api-key';
    return getQuestion(prompt, model, 'GetPromptAnswer').then((question) => {
      const endpointUrl = 'https://api.openai.com/v1/completions';
  
      const data = {
        model : "code-davinci-002",
        prompt: `###\n${prompt}\nUnderstand the question being asked and provide an optimal answer.:`,
        max_tokens: 400,
        "temperature": 0.7,
        stop:['###']
      };
  
      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      };
      showLoading();
      return fetch(endpointUrl, {
        method: "POST",
        headers: headers,
        body: JSON.stringify(data),
      })
        .then((response) => response.json())
        .then((result) => {
          const answer = result.choices[0].text.trim();
          hideLoading();
          return answer;
        })
        .catch((error) => {
          console.error(error);
          hideLoading();
        });
    });
  }
  
  function stripTags(html) {
    // Create a temporary element to hold the HTML content
    const temp = document.createElement('div');
    temp.innerHTML = html;
    
    // Extract the text content from the temporary element
    const text = temp.textContent || temp.innerText || '';
    
    // Remove the temporary element from the DOM
    temp.remove();
    
    // Return the text content
    return text.trim();
  }
  function getPromptByType(type) {
    switch (type) {
      case 'GetPromptAnswer':
        return 'Understand the question being asked and provide an optimal answer.';
      case 'GetCode':
        return 'Extract the exact question and any code samples provided. Remove the unnecessary text and perform an exact question extraction. Provide the code to solve the problem.';
      case 'GetOptions':
        return 'Extract the exact question and options being asked. Remove the unnecessary text and perform an exact question and options extraction. List the options along with the correct answer.';
      default:
        return '';
    }
  }