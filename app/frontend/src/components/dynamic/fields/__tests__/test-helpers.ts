/**
 * Common test helpers and stubs for dynamic field components
 */

export const primevueStubs = {
  InputText: {
    template: '<input v-bind="$attrs" @input="$emit(\'update:modelValue\', $event.target.value)" />',
    props: ['modelValue', 'id', 'placeholder', 'disabled', 'type'],
    emits: ['update:modelValue'],
  },
  InputNumber: {
    template: '<input type="number" v-bind="$attrs" @input="$emit(\'update:modelValue\', parseFloat($event.target.value) || null)" />',
    props: ['modelValue', 'id', 'placeholder', 'disabled', 'mode', 'currency', 'locale', 'minFractionDigits', 'maxFractionDigits'],
    emits: ['update:modelValue'],
  },
  InputSwitch: {
    template: '<input type="checkbox" v-bind="$attrs" :checked="modelValue" @change="$emit(\'update:modelValue\', $event.target.checked)" />',
    props: ['modelValue', 'id', 'disabled'],
    emits: ['update:modelValue'],
  },
  DatePicker: {
    template: '<input type="date" v-bind="$attrs" @change="$emit(\'update:modelValue\', $event.target.value)" />',
    props: ['modelValue', 'id', 'placeholder', 'disabled', 'showIcon', 'dateFormat', 'showTime', 'showSeconds', 'hourFormat'],
    emits: ['update:modelValue'],
  },
  Textarea: {
    template: '<textarea v-bind="$attrs" @input="$emit(\'update:modelValue\', $event.target.value)"></textarea>',
    props: ['modelValue', 'id', 'placeholder', 'disabled', 'rows', 'autoResize'],
    emits: ['update:modelValue'],
  },
  Select: {
    template: '<select v-bind="$attrs" @change="$emit(\'update:modelValue\', $event.target.value)"><slot /></select>',
    props: ['modelValue', 'id', 'placeholder', 'disabled', 'options', 'optionLabel', 'optionValue', 'showClear', 'filter', 'loading'],
    emits: ['update:modelValue'],
  },
  MultiSelect: {
    template: '<select multiple v-bind="$attrs" @change="$emit(\'update:modelValue\', Array.from($event.target.selectedOptions).map(o => o.value))"><slot /></select>',
    props: ['modelValue', 'id', 'placeholder', 'disabled', 'options', 'optionLabel', 'optionValue', 'showClear', 'display'],
    emits: ['update:modelValue'],
  },
  FileUpload: {
    template: '<input type="file" v-bind="$attrs" @change="handleFileChange" />',
    props: ['id', 'disabled', 'mode', 'auto', 'chooseLabel'],
    emits: ['select'],
    methods: {
      handleFileChange(event: any) {
        const files = event.target.files;
        if (files && files.length > 0) {
          this.$emit('select', { files: Array.from(files) });
        }
      }
    }
  },
  Button: {
    template: '<button v-bind="$attrs" @click="$emit(\'click\')"><slot /></button>',
    props: ['icon', 'label'],
    emits: ['click'],
  },
  Editor: {
    template: '<div v-bind="$attrs"><div class="ql-toolbar"><slot name="toolbar" /></div><div contenteditable @input="handleInput"></div></div>',
    props: ['modelValue', 'id', 'disabled', 'editorStyle'],
    emits: ['update:modelValue'],
    methods: {
      handleInput(event: any) {
        this.$emit('update:modelValue', event.target.innerHTML);
      }
    }
  },
};

export const createMockPrimeVueConfig = () => ({
  config: {
    ripple: false,
    inputStyle: 'outlined',
    locale: {
      dayNames: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      dayNamesShort: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
      dayNamesMin: ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'],
      monthNames: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
      monthNamesShort: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    },
  },
});
