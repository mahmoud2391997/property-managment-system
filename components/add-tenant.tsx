'use client'
import Input from './costume-ui/input'
import InputGroup from './costume-ui/input-group'
import Select from './costume-ui/select'
import Option from './costume-ui/option'
import { User, Building2 } from 'lucide-react'
import { useSingleSelectOption } from '@/hooks/useSingleSelectOption'
import { useState } from 'react'

const AddTenant = () => {
  const identityTypes: string[] = ['MyKad', 'Passport']

  const { options, selectByIndex } = useSingleSelectOption([
    {
      Icon: User,
      label: 'Individual',
      isSelected: true
    },
    {
      Icon: Building2,
      label: 'Company',
      isSelected: false
    }
  ])
  const [selectedOption, setSelectedOption] = useState<number>(0)

  const individual = () => {
    return (
      <>
        <div className='inputs-container'>
          <InputGroup label='Identity' isRequired>
            <Select
              label='Identity Types'
              items={identityTypes}
              placeholder='Select a state'
              required
            />
          </InputGroup>
          <InputGroup label='Identity No' isRequired>
            <Input
              minLength={6}
              maxLength={12}
              placeholder='E.g. Abc123456'
              required
            />
          </InputGroup>
        </div>
        <div className='inputs-container'>
          <InputGroup label='First Name' isRequired>
            <Input placeholder='E.g. Mohammed' required />
          </InputGroup>
          <InputGroup label='Last Name'>
            <Input placeholder='E.g. Ali' />
          </InputGroup>
        </div>
        <div className='inputs-container'>
          <InputGroup label='Phone Number' isRequired>
            <Input placeholder='E.g. +6011286643' note='Used to redirect to Whatsapp' required />
          </InputGroup>
          <InputGroup label='Email' isRequired>
            <Input type='email' placeholder='E.g. Ali' required />
          </InputGroup>
        </div>
      </>
    )
  }

  const company = () => {
    return (
      <>
        <div className='inputs-container'>
          <InputGroup label='Company Registration No' isRequired>
            <Input placeholder='E.g. 1234567-X' required />
          </InputGroup>
          <InputGroup label='Company Name' isRequired>
            <Input placeholder='E.g. Example Sdn Bhd' required />
          </InputGroup>
        </div>
        <div className='inputs-container'>
          <InputGroup label='Contact Person Name' isRequired>
            <Input placeholder='E.g. Mohammed Ali' required />
          </InputGroup>
          <InputGroup label='Email' isRequired>
            <Input placeholder='E.g. ahmedali@example.com' required />
          </InputGroup>
        </div>
        <div className='inputs-container'>
          <InputGroup label='Phone Number' isRequired>
            <Input placeholder='E.g. +6011286643' note='Used to redirect to Whatsapp' required />
          </InputGroup>
          <InputGroup label='Mobile Number'>
            <Input placeholder='E.g. +6011286643' />
          </InputGroup>
        </div>
      </>
    )
  }

  return (
    <div className='flex flex-col gap-7.5'>
      <InputGroup label='Type'>
        <div className='flex gap-5'>
          {options.map((option, index) => (
            <Option
              key={index}
              Icon={option.Icon}
              label={option.label}
              isSelected={option.isSelected}
              onClick={() => {
                selectByIndex(index)
                setSelectedOption(index)
              }}
            />
          ))}
        </div>
      </InputGroup>
      {selectedOption === 0 ? individual() : company()}
    </div>
  )
}

export default AddTenant
