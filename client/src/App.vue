<script setup>
import { ref, watch, reactive, watchEffect } from "vue";
import { io } from "socket.io-client";

/* data */
const newMessage = ref(null);
const typing = ref(false);
const ready = ref(false);
const info = reactive([]);
const connections = ref(0);
const messages = reactive([]);
const username = ref(null);

/* socket setup */
// "undefined" means the URL will be computed from the `window.location` object
const URL =
  process.env.NODE_ENV === "production" ? undefined : "http://localhost:3000";
// create a communication channel
const socket = io(URL);
// setup listening
socket.on("chat-message", (data) => {
  messages.push({
    message: data.message,
    type: 1,
    user: data.user,
  });
});

socket.on("typing", (data) => {
  typing.value = data;
});

socket.on("stopTyping", () => {
  typing.value = false;
});

socket.on("joined", (data) => {
  info.push({
    username: data.name,
    type: "joined",
  });

  messages.push(...data.messages);

  setTimeout(() => {
    info.length = 0;
  }, 5000);
});

socket.on("leave", (data) => {
  info.push({
    username: data,
    type: "left",
  });

  setTimeout(() => {
    info.length = 0;
  }, 5000);
});

socket.on("connections", (data) => {
  connections.value = data;
});

/* watchers */
watch(newMessage, (_new, _old) => {
  _new ? socket.emit("typing", username.value) : socket.emit("stopTyping");
});

/* methods */
// sends messages
const send = () => {
  messages.push({
    message: newMessage.value,
    type: 0,
    user: "Me",
  });

  socket.emit("chat-message", {
    message: newMessage.value,
    user: username.value,
  });
  newMessage.value = null;
};

// add that specific user to the chat
const addUser = () => {
  ready.value = true;
  socket.emit("joined", username.value);
};

/* lifecycle hooks */
window.onbeforeunload = () => {
  socket.emit("leave", username.value);
};
</script>

<template>
  <div class="container">
    <div class="col-lg-6 offset-lg-3">
      <!-- joining/lefting users info -->
      <div v-if="ready">
        <p v-for="(user, i) in info" :key="i">
          {{ user.username }} {{ user.type }}
        </p>
      </div>

      <!-- join user -->
      <div v-if="!ready">
        <h4 class="mb-2">Enter your username</h4>
        <form @submit.prevent="addUser">
          <div class="form-group row">
            <input
              type="text"
              class="form-control col-9 mb-2"
              v-model="username"
              placeholder="Enter username here"
            />
            <input
              type="submit"
              value="Join"
              class="btn btn-md btn-info ml-1"
            />
          </div>
        </form>
      </div>
      <h2 v-else>{{ username }}</h2>

      <!-- chat panel -->
      <div class="card bg-info" v-if="ready">
        <div class="card-header text-white">
          <h4>
            My Chat App
            <span class="float-right">{{ connections }} connections</span>
          </h4>
        </div>

        <div class="card-body text-white">
          <!-- messages -->
          <ul class="list-group list-group-flush text-right mb-2">
            <small v-if="typing" class="text-white"
              >{{ typing }} is typing</small
            >
            <li
              class="list-group-item"
              v-for="(message, i) in messages"
              :key="i"
            >
              <span :class="{ 'float-left': message.type === 1 }">
                {{ message.message }}
                <small>:{{ message.user }}</small>
              </span>
            </li>
          </ul>
          <!-- enter new message -->
          <form @submit.prevent="send">
            <div class="form-group">
              <input
                type="text"
                class="form-control"
                v-model="newMessage"
                placeholder="Enter message here"
              />
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.container {
  width: 100vw;
}
</style>
