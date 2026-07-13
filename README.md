# Congr.io

- [README en Español](./README.es.md)
- [README in English](./README.en.md)

---

## 📦 Backend

- [Backend – Español](./back/README.es.md)
- [Backend – English](./back/README.en.md)

---

## 🎨 Frontend

- [Frontend – Español](./front/README.es.md)
- [Frontend – English](./front/README.en.md)

Fase 1: Personas, eventos y flows (nuestros pasos). NUEVOS
Fase 2: Servidores
Fase 3: Management y nuevas secciones que surjan de las otras fase

CONDITIONAS FOR FLOW STEPS (like if it existis in this table, bla bla)

VOLUNTERS/CALENDAR OF SERVICE

EVENT RECURRENCE

- CRON BY PROVIDER

DATABASE HISTORY (OPTIONAL SWITCH)

Data necessary to present??

how to implement??

historical data??

REPORTS? FOR THE DAY, week, location

- volunteers
- new people
- events
- attendance

12. Flow Creation is still broken

- use react flow
- the idea is to have just a main view with custom nodes
- we can click on one node and a mini menu will open to delete it, rename it, add description, associate event type or add node
- again the rules are that if we assocaite an event type to a flow then if a person attedns that event type the person will "complete" that step, that needs to happen when we capture the attendance of the person (we need to check if there are flows that need that event type) but if we are associating one existing where persons already attended we need to ask if we need to autocomplete it or just capture new data

14. For each congregation location:

- we need to add a new module under congregation setup (initial setup or edit/create new congregation) that is called Services, and under services we need a subitem for "new people", "seguimiento" and "attendance"
- having services:
  - will add another field to the congregation setup (it will hide or appear depending on the selection) that will be required if services is on, were we can rename how do we call the service, (similar to how do we call the congregation where we can choose between predefined names and enter custom one), so take evangelical and catholic common services/cult names and use them there
  - it will enable a new CRUD section and sidebar route (using the defined name), we need to reuse all the existing configuration of all the other crud sections (filters, seearch, etc), a service just needs to chose the congregation location where it happens, day of the week, start and end time (use correct saved timezone) and a little description and name
- having the subitem "new people"
  - we will need a new crud section where we see the item PER DAY, meaning that we have one "new people" main entity per service in a specific day in a specific location (we will just associate the service and date since the service already has the location) and then we need to capture new people, basically each new people is a new person, so from here we will create new persons always, meaning that an user with permission to create here will need permission to also create on person.
  - we here need the "crud" version (with all the filters and things) in a tab and the "today" version, just visible when there is currently a service "using the timezone correctly", meaning that we could have 3 people saving data for new people, they each will create separate persons and save them here in the "today" view, but historically we will jsut see one entry for the new members of that day on the crud. And then on the crud we could see that for the day we had people and if we have permissions to edit we can edit a day.
  - and if we are missing a day or entering from a day that doesnt have a service we need to be able to add a new group of new persons (searching for existing people only here)
- having the subitem "seguimiento" (not sure the word in english, we support both translate it corectly)
  - this depends on new people, we can't have one without the other
  - this will also requires the "flows" module enabled
  - this is because we will see a new "seguimientos" section adn link on the sidebar, where we will have all the new people listed there (automatically sorted by their first visit day and automatically showing just the uncompleted ones)
  - so from flow we will create a "seguimiento" flow (an specific flow type) that is automatically create when we enable this module (even if we are editing an existing congregation), this flow can't be deleted, by default we have just 2 steps (first visit and contacted) but we could edit it as we want.
  - adding a step to this flow will add a column to the seguimientos list (the first step is the only one not visible)
  - this will allow us to create a flow like this: first visit -> contacted -> first talk. but we can end in two ways so we en in "first talk" and "wont come again". So in this example on the seguimiento section we will see all the new people from past weeks that don't the flow completed yet (same pagination funtionallyty, just by default sort by visitation day), since they are already there then the first step is completed and we dont need a column for that, but we will show by default the phone column (and the user could add/remove all the other persons columns that they want and save them for that section) and we will always show one column per node of the flow, so we will have a "contacted" column and a "first talk" and "wont come again" column, from this section if the user can create the following we can add more people to be contacted manually (we need a form to manually enter and select the service and date that they first attended to), and if the user has permission to edit then it can switch on an off all the other steps. But in our example since it can end in two paths, then those should be exclusive, meaning that if we click "first talk" then "won't come again" shouild siplay an alert if we try to set it up in true indicating that it will unmark "first talk" since the steps are mutually exclusive on the flow
  - add a little explanation on the flow for this so the user can see it and understand it
  - having this sub item opens up another flows path, making flows complete with other flows, lets say part of the "membership" flow in our congregation is the "first visit", then we should be able to take any node in any flow and "link it" to another step in another flow, so completing one will complete the other one
- having the subitem "attendance"
  - checking this will insert a new configuration step when creating a congregation (and when adding or editing one) to select "what people are we counting" by default just add "Adults" and "Kids" but on the setup we could add/remove to be as specific as we want. Each one needs its own color
  - it will be just a counter, similar to "new people" we will ned a crud section we will have two tabs, one for today and one historic crud.
  - for the today (if there is a service in the day and is happening right now) we will show just 3 big things per group counted. Minus button, current and plus button. So we will show "cards" for each item, so in our initial example one card for adults and one for kids. this needs to autorefresh every 30 seconds so multiple people could take attendance at the same time, but again, it will only associate one "main" attendance per service regardless of how many people are marking it. And we dont need a "save" button but we need a debounce, so a person can click 5 times, the counter will increase 5 times but it will save just once. And we need to "queue" or be smart about the attendance, meaning that if we have 10 people now, User A increase 5 peoples, User B increases 4, user C removes 1 and user A increase 2 more at the end we will have 10+5+3-1+2 = 19 (i think, you get the idea)

15. also adding new modules requires that each congregation goes to their settings and turn it on, so its opt in on new modules on the code

16. Simlar to other section, we need 2 tabs in event attendance, the "today" tab (or right now) displaying the current event in progress (what we already have) and the CRUD historic one were we can edit old ones or create missing ones

17. for all the "today" / "right now" tabs (service attendance, new people, event attendance):

- we could have multiple things happenign at once or have services one after another, so by default we load the one thing happening now or that will happen later in the day, and we automatically will have a top input/dropdown/something to select the next service or the next event (we will have it so we can "go back" on the day to add a missing one)

TEST FLOWS, ATTENDANCE AND REGISTRATION

FLOWS? add flow without event type

share to the same event type in the same qr

create random events at the same time, one per month, from a year before and a year after, of the event types
