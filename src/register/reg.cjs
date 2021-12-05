const {SlashCommandBuilder} = require("@discordjs/builders")
const {REST} = require("@discordjs/rest")
const {Routes} = require("discord-api-types/v9")
const configs = require("./config.json")

const commands = [
  new SlashCommandBuilder().setName("record").setDescription("Records your current weight.").addStringOption(option => 
    option.setName("weight").setDescription("How much do you weight? :)").setRequired(true)
  ).addStringOption(option => 
    option.setName("passcode").setDescription("Your passcode is needed to view this content.").setRequired(true)),
  new SlashCommandBuilder().setName("progress").setDescription("Wanna see your progress?").addStringOption(option => 
  option.setName("passcode").setDescription("Your passcode is needed to view this content.").setRequired(true)),
  new SlashCommandBuilder().setName("new").setDescription("New user? Select this!")
].map(command => command.toJSON());

const rest = new REST({ version: '9' }).setToken(configs.BOT_TOKEN);

(async () => {
  try {
    console.log('Started refreshing application (/) commands.');
    

    await rest.put(
      Routes.applicationGuildCommands(configs.BOT_CLIENT_ID, configs.GUILD_ID),
      { body: commands },
    );

    console.log('Successfully reloaded application (/) commands.');
  } catch (error) {
    console.error(error);
  }
})();