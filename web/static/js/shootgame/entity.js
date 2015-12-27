function EntityTimeTrigger(trigger_time, trigger_event) {
    this.dead = false;
    this.tick = function (time) {
        if (time >= trigger_time) {
            this.dead = true;
            trigger_event();
        }
    };
}
