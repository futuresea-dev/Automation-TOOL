<template lang="pug">
main.container.my-4
  .notifications.position-fixed.p-4( style="left:0;bottom:0;z-index:999999999999;")
    .toast(v-for="{id,type,str,icon,color} in messages" :key="id" style="opacity:1;")
      .toast-body.text-capitalize.d-flex.align-items-center
        IconVue.mr-2(:name="icon" :size="1.6" :class="`text-${color}`")
        strong.mr-auto {{str}}
  HeaderVue.mb-5
  .add-task-btn(@click="showHideForm" :style="`transform: rotate(${Number(show.addTaskForm) * 45}deg);`")
    IconVue(name="plus" color="#fff" :stroke-width="1.8" :has-background="false" class="m-0")

  form(v-show="show.addTaskForm" @submit.prevent="show.addTaskForm = false; createTask(); ")
    .two-cols-grid
      div(v-for="x in formItems.filter(x => x.type  !== 'textarea')")
        label(:for="x.name") {{x.label || x.name}}
        select.form-select(v-if="x.type === 'select'" v-model="x.value")
          option(v-for="(value, key) in x.options" :key="key" :value="key") {{value}}
        input.form-control(v-else :type="x.type || 'text'" :placeholder="x.placeholder" :minLength="x.minLength" :pattern="x.pattern" v-model="x.value" required)
    .my-1
      div(v-for="x in formItems.filter(x => x.type  === 'textarea')")
        label(:for="x.name") {{x.label || x.name}}
        textarea.form-control(:placeholder="x.placeholder" rows="3" v-model="x.value" required) 
    .mt-4
      .form-image.my-1
        .d-flex.align-items-center.px-1(@click="promptChooseFile")
          input.image-input(type="file" accept=".png,.jpg" multiple="true" @input="setImages")
          .d-flex.justify-content-start.align-items-center.overflow-hidden
            IconVue(name="image" color="#e1e3e6" :hasBackground="false" :size="1.8" :strokeWidth="1.2")
            .ml-1.text-nowrap.overflow-hidden(:style="`text-overflow: ellipsis; color: ${formImages.length? 'currentColor':'#989ca2'};`") {{ formImages.length?`${formImages.length} images selected` : 'Choose Files...'}}
    input.btn.btn-primary.btn-block.mt-4(type='submit')

  .row.text-capitalize.align-items-center.my-4
    .col-md-2.font-weight-bold
      span.mr-3.font-weight-light(style="opacity: 0.5;") #
      span License
    .font-weight-bold(v-for="x in ['Price', 'Email:3', 'Password', 'Status:1']" :class="[`col-md-${x.split(':')[1] || 2}`]") {{x.split(':')[0]}}

  .text-center.mt-5.text-nowrap.text-capitalize.text-muted(v-if="!tasks.length") no tasks yet, create one by clicking the + button

  .task.row.align-items-center.my-4(v-for="({_id, license, price, email, password, state, error, carLink}, index) in tasks" :key="_id")
    .col-md-2
      span.mr-3.font-weight-light(style="opacity: 0.5;") {{index + 1}}
      span {{license}}
    .col-md-2 {{price}}$
    .col-md-3 {{email}}
    .col-md-2 {{password}}
    .col-md-1.d-flex.align-items-center(@click="state==='crashed' && error? newMessage(error, 'error', 5000): carLink? openInNewPage(carLink): ''")
      .circle.mr-1(:class="statesColors[state]")
      .fw-bold.me-1 {{state}}
    .col-md-2.actions.d-flex.align-items-center
      IconVue.ml-2(name="trash-2" :size="1.9" :color="'#fd3145'" title="Delete" @click.native="deleteTask(_id)")
      IconVue.ml-2(name="copy" :size="1.9" :color="'#0d6efd'" title="Copy" @click.native="copyTask(_id)")
      IconVue.ml-2(name="rotate-cw" :size="1.9" :color="'#28a745'" title="Restart (add to queue)" v-if="state==='crashed' || state==='finished'" @click.native="restartTask(_id)")
</template>

<script>
import axios from 'axios';
import Vue from 'vue';

import HeaderVue from '../components/Header.vue';
import IconVue from '../components/Icon.vue';

axios.defaults.baseURL = 'http://localhost:8080/api';
axios.defaults.withCredentials = true;

export default {
  components: { HeaderVue, IconVue },
  data: function () {
    return {
      show: {
        addTaskForm: false,
      },
      formItems: [
        {
          name: 'email',
          type: 'email',
          placeholder: 'e.g. Joh@company.com',
        },
        {
          name: 'password',
          placeholder: '8 characters at least',
          minLength: 8,
        },
        {
          name: 'license',
          placeholder: 'e.g. 76-SR-RK',
        },
        {
          name: 'color',
          type: 'select',
          value: 0,
          options: {
            1: 'Beige',
            2: 'Blauw',
            3: 'Bruin',
            4: 'Brons',
            5: 'Geel',
            6: 'Grijs',
            7: 'Groen',
            10: 'Rood',
            11: 'Zwart',
            12: 'Zilver',
            13: 'Paars',
            14: 'Wit',
            15: 'Oranje',
            16: 'Goud',
          },
          indexValue: true,
        },
        {
          name: 'mileage',
          type: 'number',
          placeholder: 'e.g. 21500',
        },
        {
          name: 'price',
          type: 'number',
          placeholder: 'e.g. 7500',
        },
        {
          name: 'zip',
          placeholder: 'e.g. 9734 BL',
        },
        {
          name: 'city',
          placeholder: 'e.g. Zonland',
        },
        {
          name: 'phone',
          placeholder: 'e.g. 06-83702194',
          type: 'tel',
          pattern: '[0-9]+-[0-9]+',
        },
        {
          name: 'description',
          type: 'textarea',
        },
      ],
      formImages: [],
      tasks: [],
      messages: [],
      statesColors: {
        pending: 'bg-secondary',
        running: 'bg-primary',
        crashed: 'bg-danger',
        finished: 'bg-success',
      },
      page: 1,
    };
  },

  mounted() {
    this.loadResults();
    setInterval(this.loadResults.bind(this), 1500);
  },

  methods: {
    randomStr(
      length = 8,
      chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'
    ) {
      let result = '';
      for (let i = length; i > 0; i -= 1)
        result += chars[Math.floor(Math.random() * chars.length)];
      return result;
    },

    showHideForm() {
      this.show.addTaskForm = !this.show.addTaskForm;

      for (const x of this.formItems) x.value = '';
      this.formImages = [];

      this.formItems.find((x) => x.name === 'password').value =
        this.randomStr(4, 'abcdefghijklmnopqrstuvwxyz') +
        this.randomStr(4, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ') +
        this.randomStr(3, '-@$#%!_=+') +
        this.randomStr(3, '0123456789');
    },

    // Images
    promptChooseFile() {
      document.querySelector(`input[type="file"]`).click();
    },

    setImages(event) {
      let { files } = event.target;
      files = Array.from(files).map((file) => ({ name: file.name, file }));
      console.log(
        'files:',
        files.map((x) => x.name)
      );

      this.formImages = files;
    },

    async createTask() {
      try {
        let data = new FormData();
        for (const x of this.formItems)
          data.append(x.name, !x.value ? '' : x.value);
        for (const image of this.formImages) {
          if (image.file)
            data.append('images', image.file, {
              headers: {
                'Content-Type': `multipart/form-data; boundary=${data._boundary}`,
              },
            });
          else if (image.name) data.append('images', image.name);
        }

        const {
          data: { data: task },
        } = await axios.post('/task', data);

        this.tasks.unshift(task);
      } catch (error) {
        this.handleAxiosErr(error);
      }
    },

    async deleteTask(id) {
      try {
        await axios.delete(`/task/${id}`);
        const index = this.tasks.find((x) => x._id === id);
        if (index + 1) this.tasks.splice(index, 1);
        this.newMessage('task deleted successfully');
      } catch (error) {
        this.handleAxiosErr(error);
      }
    },

    async restartTask(id) {
      try {
        await axios.get(`/task/restart/${id}`);
        this.newMessage('added to queue successfully');
        await this.loadResults();
      } catch (error) {
        this.handleAxiosErr(error);
      }
    },

    copyTask(id) {
      const task = this.tasks.find((x) => x._id === id);
      console.log('task :>> ', task);
      if (!task) return this.newMessage(`can't find the task`);

      for (const x of this.formItems) x.value = task[x.name];
      this.formImages = task.images.map((name) => ({ name }));

      this.show.addTaskForm = true;
    },

    async loadResults() {
      try {
        const {
          data: { data: tasks },
        } = await axios.get(`/task?limit=99999`);
        this.tasks = tasks;
        if (tasks.length) this.page = this.page + 1;
      } catch (error) {
        this.handleAxiosErr(error);
      }
    },

    handleAxiosErr(error) {
      const message =
        error &&
        error.response &&
        error.response.data &&
        error.response.data.message
          ? error.response.data.message
          : 'Something went wrong!';
      // for dev
      if (message === 'Something went wrong!') console.log(error);
      this.newMessage(message, 'error', 5000);
    },

    randomID() {
      return (
        String.fromCharCode(65 + Math.floor(Math.random() * 26)) +
        '-' +
        Date.now()
      );
    },

    newMessage(
      str = "it's all going just fine",
      type = 'info',
      timeout = 3000
    ) {
      const id = this.randomID();
      this.messages.push({
        id,
        type,
        str,
        icon:
          type === 'error'
            ? 'alert-circle'
            : type === 'success'
            ? 'check-circle'
            : 'bell',
        color: type === 'error' ? 'danger' : type === 'info' ? 'primary' : type,
      });
      const timer = setTimeout(() => {
        this.messages.splice(
          this.messages.findIndex((message) => message.id === id),
          1
        );
        // clearTimeout(timer);
      }, timeout);
    },

    openInNewPage(url) {
      if (!url.startsWith('http'))
        return this.newMessage(`"${url}" isn't a url`, 'error');
      window.open(url, '_blank');
    },
  },
};
</script>

<style lang="scss" scoped>
.add-task-btn {
  background-color: #0d6efd;
  cursor: pointer;
  border-radius: 50%;
  position: fixed;
  bottom: 2.5rem;
  right: 2.5rem;
  width: 3.8rem;
  height: 3.8rem;
  padding: 0.7rem;
  z-index: 100000;
  transition: transform 0.1s;
}

.add-task-btn > .icon-cont {
  width: 100% !important;
  height: 100% !important;
}

.two-cols-grid {
  display: grid;
  grid-template-columns: repeat(2, calc(50% - 0.25rem));
  grid-gap: 0.5rem;
  gap: 0.5rem;
}

.circle {
  padding: 0.3rem;
  border-radius: 50%;
}

.task {
  .actions {
    opacity: 0;
    pointer-events: none;
  }

  &:hover .actions {
    opacity: 1;
    pointer-events: auto;
  }
}

.form-image {
  & > div {
    position: relative;
    height: 3rem;
    border: 2px dashed #f6f7f8;
    border-radius: 0.2rem;
  }

  &:not(:last-child) {
    padding-right: 0.8rem;
  }

  input[type='file'] {
    display: none;
  }
}
</style>
