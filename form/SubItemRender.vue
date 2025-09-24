<template>
  <VCol
    :id="id"
    style="background: rgb(var(--v-theme-disable));"
    class="rounded pa-0 py-2"
    :class="[readonly ? 'mc-wrapper' :'']"
  >
    <template
      v-for="(fieldValue, index) in modelValue"
      :key="index"
    >
      <VCard
        flat
        border
        class="d-flex flex-sm-row flex-column-reverse w-full ma-4"
        :class="[props.isDisable ? 'mc-disable' : '']"
      >
        <div class="pa-5 flex-grow-1">
          <VRow>
            <template
              v-for="(field, key) in subItemFields[index]"
              :key="key"
            >
              <VCol
                v-if="field.visible"
                :cols="field.width"
                :sm="field.width"
              >
                <template v-if="field.type === 'text' || field.type === 'number'">
                  <VTextField
                    v-model="modelValue[index][field['value']]"
                    :label="RenderLabel(field)"
                    :placeholder="field.placeholder ?? $t('please_enter')"
                    :disabled="field.disabled"
                    :rules="[...formatRule(field.rule)]"
                    :error-messages="getErrorMessages(index, field['value'])"
                    :type="field.type"
                    @update:model-value="triggerHotField(subItemFields[index], field, $event, modelValue[index])"
                  />
                </template>
                <template v-else-if="field.type === 'textarea'">
                  <VTextarea
                    v-model="modelValue[index][field['value']]"
                    :label="RenderLabel(field)"
                    :placeholder="field.placeholder ?? $t('please_enter')"
                    :disabled="field.disabled"
                    :rules="[...formatRule(field.rule)]"
                    :error-messages="getErrorMessages(index, field['value'])"
                    @update:model-value="triggerHotField(subItemFields[index], field, $event, modelValue[index])"
                  />
                </template>
                <template v-else-if="field.type === 'select'">
                  <VSelect
                    v-model="modelValue[index][field['value']]"
                    :label="RenderLabel(field)"
                    :placeholder="field.placeholder ?? $t('please_select')"
                    :items="field.choices"
                    :disabled="field.disabled"
                    :rules="[...formatRule(field.rule)]"
                    :error-messages="getErrorMessages(index, field['value'])"
                    @update:model-value="($event) => {
                      triggerHotField(subItemFields[index], field, $event, modelValue[index]);
                      emit('update:sub-item', field, $event, null , null, false , {
                        isSubItem: true,
                        subItemIndex: index,
                      });
                    }"
                  />
                </template>
                <template v-else-if="field.type === 'boolean'">
                  <VRadioGroup
                    v-model="modelValue[index][field['value']]"
                    inline
                    :label="RenderLabel(field)"
                    :rules="[...formatRule(field.rule)]"
                    :error-messages="getErrorMessages(index, field['value'])"
                    @update:model-value="triggerHotField(subItemFields[index], field, $event, modelValue[index])"
                  >
                    <VRadio
                      v-for="(option, index) in BooleanOptions"
                      :key="index"
                      :label="$t(option.label)"
                      :value="option.value"
                    />
                  </VRadioGroup>
                </template>
                <div v-else-if="field.type === 'date'">
                  <AppDateTimePicker
                    v-model="modelValue[index][field['value']]"
                    :label="RenderLabel(field)"
                    :placeholder="field.placeholder ?? $t('please_select_date')"
                    :config="{ altInput: true, altFormat: 'd/m/Y', dateFormat: 'Y-m-d' }"
                    :rules="field.rule?.includes('required') ? [requiredValidator] : []"
                    :disabled="field.disabled"
                    :error-messages="getErrorMessages(index, field['value'])"
                    @update:model-value="setErrors(index, field['value']);triggerHotField(subItemFields[index], field, $event, modelValue[index])"
                  />
                  <p :style="{ color: '#FF4D00' }">
                    {{ getErrorMessages(index, field['value']) }}
                  </p>
                </div>
                <template v-else-if="field.type === 'dateTime'">
                  <AppDateTimePicker
                    v-model="modelValue[index][field['value']]"
                    :label="RenderLabel(field)"
                    :placeholder="field.placeholder ?? $t('please_select_date_time')"
                    :rules="field.rule?.includes('required') ? [requiredValidator] : []"
                    :config="{ enableTime: true, altInput: true, altFormat: 'd/m/Y ', dateFormat: 'Y-m-d H:i' }"
                    :disabled="field.disabled"
                    :error-messages="getErrorMessages(index, field['value'])"
                    @update:model-value="setErrors(index, field['value']);triggerHotField(subItemFields[index], field, $event, modelValue[index])"
                  />
                  <p :style="{ color: '#FF4D00' }">
                    {{ getErrorMessages(index, field['value']) }}
                  </p>
                </template>
                <template v-else-if="field.type === 'time'">
                  <AppDateTimePicker
                    v-model="modelValue[index][field['value']]"
                    :label="RenderLabel(field)"
                    :placeholder="field.placeholder ?? $t('please_select_time')"
                    :config="{ enableTime: true, noCalendar: true, dateFormat: 'H:i' }"
                    :rules="field.rule?.includes('required') ? [requiredValidator] : []"
                    :disabled="field.disabled"
                    :error-messages="getErrorMessages(index, field['value'])"
                    @update:model-value="setErrors(index, field['value']);triggerHotField(subItemFields[index], field, $event, modelValue[index])"
                  />
                  <p :style="{ color: '#FF4D00' }">
                    {{ getErrorMessages(index, field['value']) }}
                  </p>
                </template>
                <div v-else-if="field.type === 'querySelect' && field.remote_url">
                  <FormQuerySelect
                    is_sub_item
                    :readonly-data="modelValue[index]"
                    :action-type="actionType"
                    :model-value="modelValue[index][field['value']]"
                    :field="field"
                    :is-disable="props.isDisable"
                    :remote-url="routes[field.remote_url]['path']"
                    :filter="field?.filter"
                    :query="field?.query"
                    :query-params="field?.queryParams"
                    :sub_item="field?.sub_item"
                    @update:model-value="(value, item) => {
                      modelValue[index][field['value']] = value;
                      triggerHotField(subItemFields[index], field, item, modelValue[index])
                    }"
                  /> 
                  <p :style="{ color: '#FF4D00' }">
                    {{ getErrorMessages(index, field['value']) }}
                  </p>
                </div>
                
                <template v-else-if="field.type === 'remoteSelect' && field.remote_url">
                  <FormQuerySelect
                    is_sub_item
                    :readonly-data="modelValue[index]"
                    :action-type="actionType"
                    :model-value="modelValue[index][field['value']]"
                    :field="field"
                    :remote-url="routes[field.remote_url]['path']"
                    :filter="field?.filter"
                    :query="field?.query"
                    :query-params="field?.queryParams"
                    no-query-search
                    @update:model-value="(value, item) => {
                      modelValue[index][field['value']] = value;
                      emit('update:subItemValue', modelValue)
                      triggerHotField(subItemFields[index], field, item, modelValue[index])
                    }"
                    @update:error="field.error = null"
                  />
                </template> 
               
                <template v-else-if="field.type === 'queryMultipleSelect' && field.remote_url">
                  <FormQuerySelect
                    is_sub_item
                    :readonly-data="modelValue[index]"
                    :action-type="actionType"
                    :field="field"
                    :model-value="modelValue[index][field['value']]"
                    :remote-url="routes[field.remote_url]['path']"
                    :filter="field?.filter"
                    :query="field?.query"
                    :query-params="field?.queryParams"
                    multiple
                    @update:model-value="modelValue[index][field['value']] = $event;triggerHotField(subItemFields[index], field, $event, modelValue[index])"
                    @update:error="field.error = null"
                  /> 
                </template>
                <template v-else-if="field.type === 'remoteMultipleSelect' && field.remote_url">
                  <FormQuerySelect
                    is_sub_item
                    :readonly-data="modelValue[index]"
                    :action-type="actionType"
                    :field="field"
                    :model-value="modelValue[index][field['value']]"
                    :remote-url="routes[field.remote_url]['path']"
                    :filter="field?.filter"
                    :query="field?.query"
                    :query-params="field?.queryParams"
                    no-query-search
                    multiple
                    @update:model-value="modelValue[index][field['value']] = $event;triggerHotField(subItemFields[index], field, $event, modelValue[index])"
                    @update:error="field.error = null"
                  /> 
                </template>
                <template v-else-if="field.type === 'querySelectTable' && field.remote_url">
                  <FormQuerySelect
                    is_sub_item
                    :readonly-data="modelValue[index]"
                    :action-type="actionType"
                    :field="field"
                    :model-value="modelValue[index][field['value']]"
                    :remote-url="routes[field.remote_url]['path']"
                    :filter="field?.filter"
                    :query="field?.query"
                    :query-params="field?.queryParams"
                    :sub_item="field?.sub_item"
                    :multiple="field?.multiple"
                    :is-readonly="true"
                    no-query-search
                    @update:model-value="(value, item) => {
                      modelValue[index][field['value']] = value;triggerHotField(subItemFields[index], field, item, modelValue[index])
                      // emit('update:sub-item', field, modelValue, null , null , false, {
                      //   isSubItem: true,
                      //   subItemIndex: index,
                      // })
                    }"
                    @update:error="field.error = null"
                  /> 
                </template>
                <div v-else-if="field.type === 'file'">
                  <FileUpload
                    ref="fileUploadRef"
                    :files="modelValue[index][field['value']]"
                    :accept="field.file.extension"
                    :max-size="field.file.maxSize"
                    :max-files="field.file.maxFile"
                    :multiple="field?.file.maxFile ? field.file.maxFile > 1 : false"
                    :label="RenderLabel(field)"
                    @remove-file="modelValue[index][field['value']].splice($event, 1)"
                    @update-file="modelValue[index][field['value']] = $event;triggerHotField(subItemFields[index], field, $event, modelValue[index])"
                  />
                  <p :style="{ color: '#FF4D00' }">
                    {{ getErrorMessages(index, field['value']) }}
                  </p>
                </div>

                <div v-else-if="field.type=== 'underline'">
                  <VDivider class="my-6" />
                </div>
              </VCol>
            </template>
          </VRow>
        </div>
        <div
          v-if="!isViewAction"
          class="d-flex flex-column align-end item-actions"
        >
          <IconBtn>
            <VIcon
              :size="24"
              icon="ri-close-line"
              :disabled="modelValue.length === 1"
              @click="removeField(index)"
            />
          </IconBtn>
        </div>
      </VCard>

      <VCol
        v-if="index === modelValue.length - 1"
        class="d-flex justify-center pt-0"
        style="padding-inline-end: 38px;"
      >
        <VBtn
          color="primary"
          class="ps-3"
          :class="[props.isDisable ? 'mc-disable' : '']"
          variant="outlined"
          @click="addField"
        >
          <VIcon
            class="me-1"
            start
            :size="24"
            icon="ri-add-line"
          />
          {{ $t('add.new') }}
        </VBtn>
      </VCol>
    </template> 
  </VCol>
</template>

<script setup>
import AppDateTimePicker from '@/@core/components/app-form-elements/AppDateTimePicker.vue'
import FileUpload from './FileUpload.vue'
import { BooleanOptions, RenderLabel, triggerHotField } from './FormHelper'
import FormQuerySelect from './QuerySelect.vue'
import { formatRule } from './useForm'

const props = defineProps({
  subItemValue: {
    required: true,
  },
  subItemField: {
    required: true,
  },
  isViewAction: {
    type: Boolean,
    default: false,
  },
  isCreate: {
    type: Boolean,
    default: false,
  },
  actionType: {
    type: String,
    required: true,
  },
  isDisable: {
    type: Boolean,
    default: false,
  },
  readonly: {
    type: Boolean,
    default: false,
  },
  id: {
    required: false,
  },
})

const emit = defineEmits(['update:modelValue', 'update:sub-item-value', 'update:sub-item'])
const modelValue = ref(props.subItemValue)
const subItemField = ref(props.subItemField)
const subItemFields = ref([subItemField.value.sub_item_fields])

onMounted(() => {
  subItemFields.value = []
  modelValue.value.forEach(data => {
    const tmpSubItemFields = (cloneObject(subItemField.value.sub_item_fields))

    if (!props.isCreate) {
      const findFieldIndex = fieldKey => tmpSubItemFields.findIndex(field => field.value === fieldKey)
      if (!data || Object.keys(data).length === 0) return
      Object.keys(data)?.forEach(fieldKey => {
        const field = tmpSubItemFields[findFieldIndex(fieldKey)]

        triggerHotField(tmpSubItemFields, field, data[fieldKey], data, true)
      })
    }

    subItemFields.value.push(tmpSubItemFields)
  })
})

function getErrorMessages(index, fieldValue) {
  return subItemField.value['error']?.[`${index}`]?.[fieldValue] 
}

function setErrors(index, fieldValue) {
  if (subItemField.value['error']?.[`${index}`]?.[fieldValue]) {
    subItemField.value['error'][`${index}`][fieldValue] = null
  }
}

const removeField = index => {
  if (modelValue.value.length === 1) return
  const filteredValue = modelValue.value.filter((_, i) => i !== index)

  modelValue.value = filteredValue

  const filteredValueSubItemFields = subItemFields.value.filter((_, i) => i !== index)

  subItemFields.value = filteredValueSubItemFields
  emit('update:subItemValue', modelValue.value)
}

const addField = () => {
  let cleanItem = {}
  const firstItem = modelValue.value[0]
  for (const key in firstItem) {
    cleanItem = {
      ...cleanItem,
      [key]: null,
    }
  }
  modelValue.value.push(cleanItem)
  subItemFields.value.push(cloneObject(subItemField.value.sub_item_fields))
  emit('update:subItemValue', modelValue.value)
}

const covertError = () => {
  if (!isEmpty(subItemField.value.error)) {
    for (const [errIndex, errValue] of Object.entries(subItemField.value.error)) {
      for (const [key, value] of Object.entries(errValue)) {
        subItemField.value.error[errIndex][key] = value
      }
    }
  } 
}

watch(subItemField.value, () => {
  covertError()
})
</script>

<style lang="scss" scoped>
.mc-wrapper {
  pointer-events: none;
}
</style>

