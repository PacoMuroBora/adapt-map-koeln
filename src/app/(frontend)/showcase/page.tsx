import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { LinkButton } from '@/components/ui/link-button'
import { Skeleton, SkeletonAvatar } from '@/components/ui/skeleton'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Field } from '@/components/ui/field'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import { Plus, Edit, Trash2, Check, X, Search, Filter, ExternalLink } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Showcase | AdaptMap Köln',
  description: 'Component showcase for AdaptMap design system',
}

export default function ShowcasePage() {
  return (
    <div className="container mx-auto max-w-7xl px-4 py-12">
      <div className="mb-12">
        <h1 className="font-headings text-[64px] font-semibold leading-[67px] tracking-[-1px] mb-4">
          Design System
        </h1>
        <p className="font-body text-lg font-normal leading-6 text-foreground-alt">
          Component showcase with all variations and states
        </p>
      </div>

      {/* Buttons Section */}
      <section className="mb-16">
        <h2 className="font-headings text-[46px] font-semibold leading-[48px] tracking-[-0.5px] mb-8">
          Buttons
        </h2>

        <div className="space-y-8">
          {/* Variants */}
          <div>
            <h3 className="font-body text-base font-semibold mb-4">Variants</h3>
            <div className="flex flex-wrap gap-4">
              <Button variant="default">Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="destructive">Destructive</Button>
              <Button variant="ghost">Ghost</Button>
            </div>
          </div>

          {/* Sizes */}
          <div>
            <h3 className="font-body text-base font-semibold mb-4">Sizes</h3>
            <div className="flex flex-wrap items-center gap-4">
              <Button size="tiny">Tiny</Button>
              <Button size="mini">Mini</Button>
              <Button size="sm">Small</Button>
              <Button size="default">Default</Button>
              <Button size="lg">Large</Button>
              <Button size="icon">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Shapes */}
          <div>
            <h3 className="font-body text-base font-semibold mb-4">Shapes</h3>
            <div className="flex flex-wrap gap-4">
              <Button shape="default">Default Shape</Button>
              <Button shape="round">Round Shape</Button>
              <Button shape="round" size="lg">Round Large</Button>
            </div>
          </div>

          {/* With Icons */}
          <div>
            <h3 className="font-body text-base font-semibold mb-4">With Icons</h3>
            <div className="flex flex-wrap gap-4">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                ADD ITEM
              </Button>
              <Button variant="outline">
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Button>
              <Button variant="destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </div>
          </div>

          {/* States */}
          <div>
            <h3 className="font-body text-base font-semibold mb-4">States</h3>
            <div className="flex flex-wrap gap-4">
              <Button disabled>Disabled</Button>
              <Button variant="outline" disabled>Disabled Outline</Button>
            </div>
          </div>
        </div>
      </section>

      {/* Inputs Section */}
      <section className="mb-16">
        <h2 className="font-headings text-[46px] font-semibold leading-[48px] tracking-[-0.5px] mb-8">
          Inputs
        </h2>

        <div className="space-y-8">
          {/* Sizes */}
          <div>
            <h3 className="font-body text-base font-semibold mb-4">Sizes</h3>
            <div className="flex flex-col gap-4 max-w-md">
              <Input placeholder="Mini input" size="mini" />
              <Input placeholder="Small input" size="sm" />
              <Input placeholder="Default input" size="default" />
              <Input placeholder="Large input" size="lg" />
            </div>
          </div>

          {/* Shapes */}
          <div>
            <h3 className="font-body text-base font-semibold mb-4">Shapes</h3>
            <div className="flex flex-col gap-4 max-w-md">
              <Input placeholder="Default shape" shape="default" />
              <Input placeholder="Round shape" shape="round" />
            </div>
          </div>

          {/* States */}
          <div>
            <h3 className="font-body text-base font-semibold mb-4">States</h3>
            <div className="flex flex-col gap-4 max-w-md">
              <Input placeholder="Placeholder text" />
              <Input value="With value" readOnly />
              <Input placeholder="Error state" className="border-error focus-visible:ring-error" />
              <Input placeholder="Disabled" disabled />
            </div>
          </div>
        </div>
      </section>

      {/* Textareas Section */}
      <section className="mb-16">
        <h2 className="font-headings text-[46px] font-semibold leading-[48px] tracking-[-0.5px] mb-8">
          Textareas
        </h2>

        <div className="space-y-8">
          <div>
            <h3 className="font-body text-base font-semibold mb-4">Variations</h3>
            <div className="flex flex-col gap-4 max-w-md">
              <Textarea placeholder="Default textarea" />
              <Textarea placeholder="Round shape" shape="round" />
              <Textarea placeholder="Small size" size="sm" />
              <Textarea placeholder="Large size" size="lg" />
              <Textarea placeholder="Error state" className="border-error focus-visible:ring-error" />
              <Textarea placeholder="Disabled" disabled />
            </div>
          </div>
        </div>
      </section>

      {/* Cards Section */}
      <section className="mb-16">
        <h2 className="font-headings text-[46px] font-semibold leading-[48px] tracking-[-0.5px] mb-8">
          Cards
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Basic Card */}
          <Card>
            <CardHeader>
              <CardTitle>Card Title</CardTitle>
              <CardDescription>Card description goes here</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="font-body text-sm">Card content area with some text.</p>
            </CardContent>
          </Card>

          {/* Card with Footer */}
          <Card>
            <CardHeader>
              <CardTitle>Card with Footer</CardTitle>
              <CardDescription>This card has a footer</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="font-body text-sm">Main content goes here.</p>
            </CardContent>
            <CardFooter>
              <Button size="sm">Action</Button>
            </CardFooter>
          </Card>

          {/* Card with Color Variants */}
          <Card className="bg-[#DBCBFD]/20 border-[#DBCBFD]">
            <CardHeader>
              <CardTitle>Purple Card</CardTitle>
              <CardDescription>Light purple background variant</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="font-body text-sm">This card uses a purple background.</p>
            </CardContent>
          </Card>

          <Card className="bg-[#FFD8BE]/20 border-[#FFD8BE]">
            <CardHeader>
              <CardTitle>Orange Card</CardTitle>
              <CardDescription>Light orange background variant</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="font-body text-sm">This card uses an orange background.</p>
            </CardContent>
          </Card>

          {/* Full Card Example */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Contact Form Card</CardTitle>
              <CardDescription>Example of a form card</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input placeholder="Name" />
              <Input placeholder="Email" type="email" />
              <Textarea placeholder="Message" />
            </CardContent>
            <CardFooter>
              <Button>Submit</Button>
            </CardFooter>
          </Card>
        </div>
      </section>

      {/* Alerts Section */}
      <section className="mb-16">
        <h2 className="font-headings text-[46px] font-semibold leading-[48px] tracking-[-0.5px] mb-8">
          Alerts
        </h2>

        <div className="space-y-4 max-w-2xl">
          {/* Default Alert */}
          <Alert>
            <AlertTitle>Information</AlertTitle>
            <AlertDescription>This is a neutral alert message.</AlertDescription>
          </Alert>

          {/* Error Alert */}
          <Alert variant="error" showIcon>
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>Something went wrong. Please try again.</AlertDescription>
          </Alert>

          {/* Success Alert */}
          <Alert variant="success" showIcon>
            <AlertTitle>Success</AlertTitle>
            <AlertDescription>Your changes have been saved successfully.</AlertDescription>
          </Alert>

          {/* Alert with Two Lines */}
          <Alert variant="success" showIcon showLine2>
            <AlertTitle>Success</AlertTitle>
            <AlertDescription>Your changes have been saved. You can continue editing.</AlertDescription>
          </Alert>

          {/* Alert with Button */}
          <Alert variant="error" showIcon showButtons>
            <AlertTitle>Warning</AlertTitle>
            <AlertDescription>Please review your input before submitting.</AlertDescription>
          </Alert>

          {/* Alert with Icon Only */}
          <Alert variant="default" showIcon>
            <AlertTitle>Notice</AlertTitle>
            <AlertDescription>This alert has an icon but uses default variant.</AlertDescription>
          </Alert>
        </div>
      </section>

      {/* Link Buttons Section */}
      <section className="mb-16">
        <h2 className="font-headings text-[46px] font-semibold leading-[48px] tracking-[-0.5px] mb-8">
          Link Buttons
        </h2>

        <div className="space-y-8">
          <div>
            <h3 className="font-body text-base font-semibold mb-4">Variations</h3>
            <div className="flex flex-wrap gap-4 items-center">
              <LinkButton href="/">Default Link</LinkButton>
              <LinkButton href="/" size="sm">Small Link</LinkButton>
              <LinkButton href="/" size="lg">Large Link</LinkButton>
              <LinkButton href="/" size="mini">Mini Link</LinkButton>
              <LinkButton href="/" shape="round">Round Link</LinkButton>
              <LinkButton href="https://example.com" external>
                External Link
                <ExternalLink className="ml-1 h-3 w-3 inline" />
              </LinkButton>
            </div>
          </div>
        </div>
      </section>

      {/* Skeletons Section */}
      <section className="mb-16">
        <h2 className="font-headings text-[46px] font-semibold leading-[48px] tracking-[-0.5px] mb-8">
          Skeletons
        </h2>

        <div className="space-y-8">
          <div>
            <h3 className="font-body text-base font-semibold mb-4">Variants</h3>
            <div className="flex flex-wrap gap-4 items-center">
              <Skeleton variant="block" />
              <Skeleton variant="line" />
              <Skeleton variant="object" />
              <Skeleton variant="avatar" />
            </div>
          </div>

          <div>
            <h3 className="font-body text-base font-semibold mb-4">Avatar with Line</h3>
            <div className="flex flex-col gap-4">
              <SkeletonAvatar />
              <SkeletonAvatar />
            </div>
          </div>
        </div>
      </section>

      {/* Alert Dialogs Section */}
      <section className="mb-16">
        <h2 className="font-headings text-[46px] font-semibold leading-[48px] tracking-[-0.5px] mb-8">
          Alert Dialogs
        </h2>

        <div className="space-y-4">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline">Open Alert Dialog</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete your account and remove your data from our servers.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction>Continue</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">Delete Item</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Item</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete this item? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction className="bg-destructive text-white hover:bg-destructive/90">
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </section>

      {/* Fields Section */}
      <section className="mb-16">
        <h2 className="font-headings text-[46px] font-semibold leading-[48px] tracking-[-0.5px] mb-8">
          Fields
        </h2>

        <div className="space-y-8 max-w-2xl">
          <Field label="Email" required>
            <Input type="email" placeholder="Enter your email" />
          </Field>

          <Field label="Name" helpText="Enter your full name">
            <Input placeholder="Enter your name" />
          </Field>

          <Field label="Message" required error="This field is required">
            <Textarea placeholder="Enter your message" />
          </Field>

          <Field label="Select Option" layout="horizontal">
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Select an option" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="option1">Option 1</SelectItem>
                <SelectItem value="option2">Option 2</SelectItem>
                <SelectItem value="option3">Option 3</SelectItem>
              </SelectContent>
            </Select>
          </Field>

          <Field label="Radio Group" layout="vertical">
            <RadioGroup defaultValue="option1">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="option1" id="option1" />
                <label htmlFor="option1" className="font-body text-sm cursor-pointer">
                  Option 1
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="option2" id="option2" />
                <label htmlFor="option2" className="font-body text-sm cursor-pointer">
                  Option 2
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="option3" id="option3" />
                <label htmlFor="option3" className="font-body text-sm cursor-pointer">
                  Option 3
                </label>
              </div>
            </RadioGroup>
          </Field>
        </div>
      </section>

      {/* Select Section */}
      <section className="mb-16">
        <h2 className="font-headings text-[46px] font-semibold leading-[48px] tracking-[-0.5px] mb-8">
          Select
        </h2>

        <div className="space-y-4 max-w-md">
          <Select>
            <SelectTrigger>
              <SelectValue placeholder="Select an option" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="option1">Option 1</SelectItem>
              <SelectItem value="option2">Option 2</SelectItem>
              <SelectItem value="option3">Option 3</SelectItem>
            </SelectContent>
          </Select>

          <Select>
            <SelectTrigger>
              <SelectValue placeholder="Select with groups" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="group1-item1">Group 1 - Item 1</SelectItem>
              <SelectItem value="group1-item2">Group 1 - Item 2</SelectItem>
              <SelectItem value="group2-item1">Group 2 - Item 1</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </section>

      {/* Radio Section */}
      <section className="mb-16">
        <h2 className="font-headings text-[46px] font-semibold leading-[48px] tracking-[-0.5px] mb-8">
          Radio Buttons
        </h2>

        <div className="space-y-8">
          <div>
            <h3 className="font-body text-base font-semibold mb-4">Radio Group</h3>
            <RadioGroup defaultValue="option1" className="space-y-2">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="option1" id="r1" />
                <label htmlFor="r1" className="font-body text-sm cursor-pointer">
                  Option 1
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="option2" id="r2" />
                <label htmlFor="r2" className="font-body text-sm cursor-pointer">
                  Option 2
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="option3" id="r3" disabled />
                <label htmlFor="r3" className="font-body text-sm text-muted-foreground cursor-not-allowed">
                  Option 3 (Disabled)
                </label>
              </div>
            </RadioGroup>
          </div>
        </div>
      </section>

      {/* Pagination Section */}
      <section className="mb-16">
        <h2 className="font-headings text-[46px] font-semibold leading-[48px] tracking-[-0.5px] mb-8">
          Pagination
        </h2>

        <div className="space-y-8">
          <div>
            <h3 className="font-body text-base font-semibold mb-4">Previous/Next</h3>
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious href="#" />
                </PaginationItem>
                <PaginationItem>
                  <PaginationNext href="#" />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>

          <div>
            <h3 className="font-body text-base font-semibold mb-4">With Page Numbers</h3>
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious href="#" />
                </PaginationItem>
                <PaginationItem>
                  <PaginationLink href="#" isActive>1</PaginationLink>
                </PaginationItem>
                <PaginationItem>
                  <PaginationLink href="#">2</PaginationLink>
                </PaginationItem>
                <PaginationItem>
                  <PaginationLink href="#">3</PaginationLink>
                </PaginationItem>
                <PaginationItem>
                  <PaginationEllipsis />
                </PaginationItem>
                <PaginationItem>
                  <PaginationNext href="#" />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        </div>
      </section>

      {/* Typography Section */}
      <section className="mb-16">
        <h2 className="font-headings text-[46px] font-semibold leading-[48px] tracking-[-0.5px] mb-8">
          Typography
        </h2>

        <div className="space-y-6">
          <div>
            <h1 className="font-headings text-[64px] font-semibold leading-[67px] tracking-[-1px] mb-4">
              Heading 1
            </h1>
            <p className="font-body text-sm text-foreground-alt">64px, Semibold, -1px tracking</p>
          </div>

          <div>
            <h3 className="font-headings text-[46px] font-semibold leading-[48px] tracking-[-0.5px] mb-4">
              Heading 3
            </h3>
            <p className="font-body text-sm text-foreground-alt">46px, Semibold, -0.5px tracking</p>
          </div>

          <div>
            <p className="font-body text-lg font-normal leading-6 mb-2">
              Paragraph Regular - 18px, Regular weight, 24px line height
            </p>
            <p className="font-body text-base font-normal leading-[21px] mb-2">
              Paragraph Small - 16px, Regular weight, 21px line height
            </p>
            <p className="font-body text-lg font-semibold leading-6">
              Paragraph Bold - Same as Regular but Semibold weight
            </p>
          </div>

          <div>
            <p className="font-sans text-base font-normal leading-none tracking-[1px]">
              Button Large - 16px, Regular, leading-none, 1px tracking
            </p>
          </div>
        </div>
      </section>

      {/* Colors Section */}
      <section className="mb-16">
        <h2 className="font-headings text-[46px] font-semibold leading-[48px] tracking-[-0.5px] mb-8">
          Colors
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <div className="h-20 bg-foreground rounded-lg"></div>
            <p className="font-body text-sm font-semibold">Foreground</p>
            <p className="font-body text-xs text-foreground-alt">#141418</p>
          </div>
          <div className="space-y-2">
            <div className="h-20 bg-foreground-alt rounded-lg"></div>
            <p className="font-body text-sm font-semibold">Foreground Alt</p>
            <p className="font-body text-xs text-foreground-alt">#4a5768</p>
          </div>
          <div className="space-y-2">
            <div className="h-20 border-2 border-border rounded-lg"></div>
            <p className="font-body text-sm font-semibold">Border</p>
            <p className="font-body text-xs text-foreground-alt">#9f94ff</p>
          </div>
          <div className="space-y-2">
            <div className="h-20 bg-primary rounded-lg"></div>
            <p className="font-body text-sm font-semibold">Primary</p>
            <p className="font-body text-xs text-foreground-alt">Lime Green</p>
          </div>
          <div className="space-y-2">
            <div className="h-20 bg-destructive rounded-lg"></div>
            <p className="font-body text-sm font-semibold">Destructive</p>
            <p className="font-body text-xs text-foreground-alt">Orange/Red</p>
          </div>
          <div className="space-y-2">
            <div className="h-20 bg-success rounded-lg"></div>
            <p className="font-body text-sm font-semibold">Success</p>
            <p className="font-body text-xs text-foreground-alt">Green</p>
          </div>
          <div className="space-y-2">
            <div className="h-20 bg-error rounded-lg"></div>
            <p className="font-body text-sm font-semibold">Error</p>
            <p className="font-body text-xs text-foreground-alt">Red</p>
          </div>
          <div className="space-y-2">
            <div className="h-20 bg-warning rounded-lg"></div>
            <p className="font-body text-sm font-semibold">Warning</p>
            <p className="font-body text-xs text-foreground-alt">Yellow</p>
          </div>
        </div>
      </section>

      {/* Spacing Section */}
      <section className="mb-16">
        <h2 className="font-headings text-[46px] font-semibold leading-[48px] tracking-[-0.5px] mb-8">
          Spacing
        </h2>

        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-1 h-1 bg-foreground rounded-full"></div>
            <span className="font-body text-sm">2xs: 4px</span>
            <div className="w-2 h-2 bg-foreground rounded"></div>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-2 h-2 bg-foreground rounded"></div>
            <span className="font-body text-sm">xs: 8px</span>
            <div className="w-2 h-2 bg-foreground rounded"></div>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-4 h-4 bg-foreground rounded"></div>
            <span className="font-body text-sm">md: 16px</span>
            <div className="w-4 h-4 bg-foreground rounded"></div>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-6 h-6 bg-foreground rounded"></div>
            <span className="font-body text-sm">xl: 24px</span>
            <div className="w-6 h-6 bg-foreground rounded"></div>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 bg-foreground rounded"></div>
            <span className="font-body text-sm">2xl: 32px</span>
            <div className="w-8 h-8 bg-foreground rounded"></div>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-foreground rounded"></div>
            <span className="font-body text-sm">5xl: 64px</span>
            <div className="w-16 h-16 bg-foreground rounded"></div>
          </div>
        </div>
      </section>
    </div>
  )
}
