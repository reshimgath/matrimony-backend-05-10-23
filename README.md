# All mongodb models are placed inside Models folder
 A)OTP (schema to create otp with values)
 B)USER (scheama to store user details)
 C)PLANS (scheama for plans)

# Middlewears
 A)UserExist
 B)CheackRole


# All api routes are placed inside api

  ## for Users
 A)CRUD:success stories
 
 B) Analatics api for count
 
 C) Normalsearch :(filter based on user inputs) * note: only for logged in users
 
 D) AdvanceSerach :(filter based on advance search inputs) * note: only for logged and who completed 100 % profile in users 
 
 E) Users creation for normal user
   1)register with otp normal 20% completed 
   2)add basic info 20 + 50 =70% completed 
   3)add family 70 +30 =100% completed 
   4)add horoscope details (optional)

 F) Recently created profiles(6 recently created prfiles on timestamp)

 g) get profile detals on click card 
   1)hide contact details initialy
   2)get contact details for paid user and decrease the count of userProfile

  ## Admin (root)
   1)admin can create profile itself
   2)admin can delete profiles (any)
   3)admin can update profile
   4)admin can view profiles (based on filter name,id,mobile,email)
   5)admin can create and delete normal admins
   6)admin can change active plans 
   7)admin can recharge profile

 ## Admin (normal)
   1)normal admin can only change 
   2)admin can view profiles (based on filter name,id,mobile,email)
   3)admin can change active plans 
   