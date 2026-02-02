'use client'

import { useState, forwardRef, useImperativeHandle } from 'react'
import Input from './costume-ui/input'
import InputGroup from './costume-ui/input-group'
import Select from './costume-ui/select'
import PhotoUploader from './costume-ui/photo-uploader'

export type TenantFormData = {
  identityType: string
  identityNumber: string
  firstName: string
  lastName: string
  phoneNumber: string
  email: string
  profileImage: Blob | null
  profileThumb: Blob | null
}

export type TenantFormRef = {
  getTenantData: () => TenantFormData
  reset: () => void
}

type Props = {
  loading: boolean
}

const TenantFormFields = forwardRef<TenantFormRef, Props>(
  ({ loading }, ref) => {
    const identityTypes: string[] = ['mykad', 'passport']

    const [identityType, setIdentityType] = useState<string>('')
    const [identityNumber, setIdentityNumber] = useState<string>('')
    const [firstName, setFirstName] = useState<string>('')
    const [lastName, setLastName] = useState<string>('')
    const [phoneNumber, setPhoneNumber] = useState<string>('')
    const [email, setEmail] = useState<string>('')
    const [profileImage, setProfileImage] = useState<Blob | null>(null)
    const [profileThumb, setProfileThumb] = useState<Blob | null>(null)
    const [photoUploaderKey, setPhotoUploaderKey] = useState<number>(0)

    const styles = {
      inputsContainer: 'grid grid-cols-2 items-start gap-5'
    }

    const handlePhotoSave = (mainBlob: Blob, thumbBlob: Blob) => {
      setProfileImage(mainBlob)
      setProfileThumb(thumbBlob)
    }

    useImperativeHandle(ref, () => ({
      getTenantData: () => ({
        identityType: identityType.toLowerCase(),
        identityNumber,
        firstName,
        lastName,
        phoneNumber,
        email,
        profileImage,
        profileThumb
      }),
      reset: () => {
        setIdentityType('')
        setIdentityNumber('')
        setFirstName('')
        setLastName('')
        setPhoneNumber('')
        setEmail('')
        setProfileImage(null)
        setProfileThumb(null)
        setPhotoUploaderKey(prev => prev + 1)
      }
    }))

    return (
      <>
        <PhotoUploader
          key={photoUploaderKey}
          description='Upload tenant profile picture here optionally'
          loading={loading}
          onSave={handlePhotoSave}
        />

        <div className={styles.inputsContainer}>
          <InputGroup label='Identity' isRequired>
            <Select
              label='Identity Types'
              items={identityTypes}
              placeholder='Select type'
              value={identityType}
              onValueChange={setIdentityType}
              required
              disabled={loading}
            />
          </InputGroup>
          <InputGroup label='Identity No' isRequired>
            <Input
              placeholder={
                identityType === 'mykad'
                  ? 'E.g. 900101014321 (12 digits)'
                  : identityType === 'passport'
                  ? 'E.g. A1234567 (6–20 characters)'
                  : 'Select Identity Type First'
              }
              value={identityNumber}
              onChange={e => {
                let val = e.target.value

                if (identityType === 'mykad') {
                  val = val.replace(/\D/g, '')
                }

                setIdentityNumber(val)
              }}
              minLength={identityType === 'mykad' ? 12 : 6}
              maxLength={identityType === 'mykad' ? 12 : 20}
              required
              disabled={loading || !identityType}
            />
          </InputGroup>
        </div>

        <div className={styles.inputsContainer}>
          <InputGroup label='First Name' isRequired>
            <Input
              placeholder='E.g. Mohammed'
              value={firstName}
              onChange={e => setFirstName(e.target.value)}
              minLength={1}
              maxLength={100}
              required
              disabled={loading}
            />
          </InputGroup>
          <InputGroup label='Last Name'>
            <Input
              placeholder='E.g. Ali'
              value={lastName}
              onChange={e => setLastName(e.target.value)}
              minLength={1}
              maxLength={100}
              disabled={loading}
            />
          </InputGroup>
        </div>

        <div className={styles.inputsContainer}>
          <InputGroup
            label='Phone Number'
            className='overflow-visible!'
            isRequired
          >
            <Input
              phoneNumber
              value={phoneNumber}
              onChange={setPhoneNumber}
              note='Used to redirect to Whatsapp'
              required
              disabled={loading}
            />
          </InputGroup>
          <InputGroup label='Email' isRequired>
            <Input
              type='email'
              placeholder='E.g. example@email.com'
              value={email}
              onChange={e => setEmail(e.target.value)}
              minLength={5}
              maxLength={255}
              required
              disabled={loading}
            />
          </InputGroup>
        </div>
      </>
    )
  }
)

TenantFormFields.displayName = 'TenantFormFields'

export default TenantFormFields
