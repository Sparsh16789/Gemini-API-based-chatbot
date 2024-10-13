const typingForm = document.querySelector(".typing-form")
const chatList = document.querySelector(".chat-list")
const suggestions=document.querySelectorAll(".suggestion-list .suggestion")
const toggleThemeButton=document.querySelector("#toggle-theme-button")
const deleteChatButton=document.querySelector("#delete-chat-button")

let userMessage = null
let isResponseGenerating=false

const API_KEY="GiveYourApiKeyHere"
const API_URL=`https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${API_KEY}`;

const loadLocalstorageData=()=>{
    const savedChats=localStorage.getItem("savedChats")

    chatList.innerHTML=savedChats || ""

    document.body.classList.toggle("hide-header", savedChats)
    chatList.scrollTo(0, chatList.scrollHeight)
}
loadLocalstorageData()

// create a new message element
const createMessageElement=(content, ...classes)=>{
    const div=document.createElement("div")
    div.classList.add("message", ...classes)
    div.innerHTML=content
    return div;
}

// show typing effect
const showTypingEffect=(text, textElement)=>{
    const word=text.split(' ')
    let currentWordIndex=0

    const typingInterval=setInterval(()=>{
        // append each word to the text with space
        textElement.innerText+=(currentWordIndex===0?'':' ')+word[currentWordIndex++]

        if (currentWordIndex===word.length) {
            clearInterval(typingInterval)
            isResponseGenerating=false
            localStorage.setItem("savedChats", chatList.innerHTML) // save chats to local storage
        }
        chatList.scrollTo(0, chatList.scrollHeight)
    },75)
}

// Fetch response based on user reply
const generateAPIResponse=async(incomingMessageDiv)=>{
    const textElement=incomingMessageDiv.querySelector(".text") //get text element

    // send post request
    try {
        const response=await fetch(API_URL,{
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({
                contents: [{
                    role: "user",
                    parts: [{text:userMessage}]
                }]
            })
        })

        const data=await response.json()
        // console.log(data) // gives response object
        if(!response.ok) throw new Error(data.error.message)

        const apiResponse=data?.candidates[0].content.parts[0].text
        // console.log(apiResponse) //gives response
        showTypingEffect(apiResponse, textElement)
    } catch (error) {
        isResponseGenerating=false
        textElement.innerText=error.message
        textElement.classList.add("error")
    } finally{
        incomingMessageDiv.classList.remove("loading")
    }
}

// show loading animation untill api responds
const showLoadingAnimation=()=>{
    const html = `<div class="message-content">
                <img src="gemini.png" alt="gemini image" class="avatar">
                <p class="text"></p>
                <div class="loading-indicator">
                    <div class="loading-bar"></div>
                    <div class="loading-bar"></div>
                    <div class="loading-bar"></div>
                </div>
            </div>
            <span onclick="copyMessage(this)" class="icon material-symbols-rounded">content_copy</span>`;
    const incomingMessageDiv= createMessageElement(html, "incoming", "loading")
    chatList.appendChild(incomingMessageDiv)

    chatList.scrollTo(0, chatList.scrollHeight)
    generateAPIResponse(incomingMessageDiv)
}

// copy text to clipboard
const copyMessage=(copyIcon)=>{
    const messageText=copyIcon.parentElement.querySelector(".text").innerText
    navigator.clipboard.writeText(messageText)
    copyIcon.innerText="done"
    setTimeout(()=>copyIcon.innerText="content_copy",1000)
}

// handle outgoing messages
const handleOutgoingChat = () => {
    userMessage = typingForm.querySelector(".typing-input").value.trim() || userMessage
    if (!userMessage || isResponseGenerating) return

    isResponseGenerating=true

    // console.log(userMessage)
    const html = `<div class="message-content">
                <img src="photograph.jpeg" alt="user image" class="avatar">
                <p class="text"></p>
            </div>`;
    const outgoingMessageDiv= createMessageElement(html, "outgoing")
    outgoingMessageDiv.querySelector(".text").innerHTML=userMessage
    chatList.appendChild(outgoingMessageDiv)

    typingForm.reset()
    chatList.scrollTo(0, chatList.scrollHeight)
    document.body.classList.add("hide-header") // hide header after chat
    setTimeout(showLoadingAnimation, 500) // show loading animation after 0.5s
}

// execute suggestions
suggestions.forEach(suggestion=>{
    suggestion.addEventListener("click",()=>{
        userMessage=suggestion.querySelector(".text").innerText
        handleOutgoingChat()
    })
})

toggleThemeButton.addEventListener("click",()=>{
    const isLightMode=document.body.classList.toggle("light_mode")
    toggleThemeButton.innerHTML=isLightMode ? "dark_mode":"light_mode"
})

// delete chat button
deleteChatButton.addEventListener("click",()=>{
    if (confirm("Are you sure you want to delete all messages?")) {
        localStorage.removeItem("savedChats")
        loadLocalstorageData()
    }
})

// prevent submission and handle messages
typingForm.addEventListener("submit", (e) => {
    e.preventDefault()
    handleOutgoingChat()
})